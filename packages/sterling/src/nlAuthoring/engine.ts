/**
 * The translate → validate → repair loop for NL layout authoring.
 *
 * The LLM handles SEMANTIC repair: findings from the staged oracles go back
 * as a repair message and the model re-answers, within a hard provider-call
 * budget. MECHANICAL weakening (fallbacks, dropped candidates) is then
 * delegated to resolveValidatedLayout — the same machinery Magic Layout uses —
 * so the preview gets per-candidate applied/weakened/omitted decisions.
 */

import * as yaml from 'js-yaml';
import {
  resolveValidatedLayout,
  validateCndSpecWithSpytial
} from '../utils/layoutSuggestions';
import type {
  CndPatch,
  LayoutSuggestion,
  LayoutValidationResult
} from '../utils/layoutSuggestions';
import {
  collectPatchFindings,
  collectSpecFindings,
  mergeSpecWithPatch,
  stripHtml
} from './oracles';
import { parseLlmReply } from './parse';
import {
  RESPONSE_JSON_SCHEMA,
  buildRepairMessage,
  buildSystemPrompt,
  buildTranslateMessages
} from './prompt';
import { buildSchemaSummary } from './schemaSummary';
import type {
  LlmMessage,
  NlAuthoringRequest,
  NlAuthoringResult,
  NlEngineDeps,
  NlFinding,
  NlLlmResponse,
  NlValidatedCandidate
} from './types';

const DEFAULT_MAX_LLM_CALLS = 3;

const failureMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/**
 * A single mechanically weakened variant of a patch, if one exists: strict
 * directly* directions relax to their plain counterparts and multi-direction
 * orientations drop to their first direction. Appended after the model's own
 * fallbacks as a last resort.
 */
export function mechanicallyWeakened(patch: CndPatch): CndPatch | undefined {
  let changed = false;
  const constraints = (patch.constraints ?? []).map((entry) => {
    const body = entry.orientation as
      | { selector?: unknown; directions?: unknown; hold?: unknown }
      | undefined;
    if (!body || !Array.isArray(body.directions)) return entry;
    let directions = body.directions.map((direction) =>
      typeof direction === 'string' && direction.startsWith('directly')
        ? direction.replace('directly', '').toLowerCase()
        : direction
    );
    directions = [...new Set(directions)];
    if (directions.length > 1) directions = [directions[0]];
    if (JSON.stringify(directions) === JSON.stringify(body.directions)) {
      return entry;
    }
    changed = true;
    return { orientation: { ...body, directions } };
  });
  if (!changed) return undefined;
  return { ...patch, constraints };
}

interface LoopState {
  transcript: LlmMessage[];
  llmCallsUsed: number;
  diagnostics: string[];
}

function failed(state: LoopState, reason: string): NlAuthoringResult {
  return {
    status: 'failed',
    transcript: state.transcript,
    candidates: [],
    diagnostics: [...state.diagnostics, reason],
    llmCallsUsed: state.llmCallsUsed
  };
}

export async function translateLayoutIntent(
  request: NlAuthoringRequest,
  deps: NlEngineDeps
): Promise<NlAuthoringResult> {
  const { provider, core, instances, rawInstance, onProgress } = deps;
  const maxLlmCalls = deps.options?.maxLlmCalls ?? DEFAULT_MAX_LLM_CALLS;
  const oracleDeps = { core, instances };

  const state: LoopState = { transcript: [], llmCallsUsed: 0, diagnostics: [] };

  if (request.priorTranscript?.length) {
    // Resuming after a clarification: the utterance is the user's answer.
    state.transcript = [
      ...request.priorTranscript,
      { role: 'user', content: request.utterance }
    ];
  } else {
    const schemaSummary = buildSchemaSummary({ instances, core, rawInstance });
    state.transcript = buildTranslateMessages(
      buildSystemPrompt({ schemaSummary, currentSpec: request.currentSpec }),
      request.utterance
    );
  }

  let response: NlLlmResponse | undefined;
  let findings: NlFinding[] = [];
  const specFindingsCache = new Map<string, NlFinding[]>();

  while (state.llmCallsUsed < maxLlmCalls) {
    onProgress?.({
      kind: state.llmCallsUsed === 0 ? 'llm-call' : 'repairing',
      message:
        state.llmCallsUsed === 0
          ? 'Asking the model…'
          : `Repairing (attempt ${state.llmCallsUsed + 1})…`
    });

    let reply: unknown;
    try {
      reply = await provider(state.transcript, { schema: RESPONSE_JSON_SCHEMA });
    } catch (error) {
      state.llmCallsUsed += 1;
      return failed(state, `The model call failed: ${failureMessage(error)}`);
    }
    state.llmCallsUsed += 1;
    state.transcript = [
      ...state.transcript,
      { role: 'assistant', content: JSON.stringify(reply) }
    ];

    const parsed = parseLlmReply(reply);
    if (!parsed.ok) {
      findings = parsed.problems.map((message) => ({
        candidateIndex: -1,
        severity: 'blocking' as const,
        stage: 'shape' as const,
        message
      }));
      response = undefined;
    } else {
      response = parsed.response;
      if (response.clarification) {
        return {
          status: 'needsClarification',
          interpretation: response.interpretation,
          question: response.clarification,
          transcript: state.transcript,
          candidates: [],
          diagnostics: state.diagnostics,
          llmCallsUsed: state.llmCallsUsed
        };
      }

      onProgress?.({ kind: 'validating', message: 'Validating candidates…' });
      findings = [];
      response.candidates.forEach((candidate, index) => {
        const patchFindings = collectPatchFindings(index, candidate.patch, oracleDeps);
        findings.push(...patchFindings);
        if (patchFindings.some(({ severity }) => severity === 'blocking')) return;
        const merged = mergeSpecWithPatch(request.currentSpec, candidate.patch);
        let specFindings = specFindingsCache.get(merged);
        if (!specFindings) {
          specFindings = collectSpecFindings(merged, index, oracleDeps);
          specFindingsCache.set(merged, specFindings);
        }
        findings.push(
          ...specFindings.map((finding) => ({ ...finding, candidateIndex: index }))
        );
      });
    }

    const blocking = findings.filter(({ severity }) => severity === 'blocking');
    if (blocking.length === 0 && response) break;

    if (state.llmCallsUsed >= maxLlmCalls) {
      if (!response) {
        return failed(
          state,
          `The model never produced a well-formed reply within ${maxLlmCalls} calls: ${blocking
            .map(({ message }) => message)
            .join(' ')}`
        );
      }
      state.diagnostics.push(
        `The call budget (${maxLlmCalls}) ran out with ${blocking.length} unresolved problem(s); falling back to mechanical weakening.`
      );
      break;
    }
    state.transcript = [
      ...state.transcript,
      { role: 'user', content: buildRepairMessage(findings) }
    ];
  }

  if (!response) {
    return failed(state, 'The model produced no usable response.');
  }
  if (response.candidates.length === 0) {
    return failed(state, 'The model returned no candidates.');
  }

  // Mechanical salvage: candidates (with their fallbacks and a last-resort
  // weakened variant) run through the same greedy accept/weaken/omit resolver
  // Magic Layout uses, validated against the CURRENT spec merged in.
  onProgress?.({ kind: 'salvaging', message: 'Composing the strongest valid spec…' });
  const suggestions: LayoutSuggestion[] = response.candidates.map(
    (candidate, index) => {
      const fallbacks = [...(candidate.fallbacks ?? [])];
      const weakened = mechanicallyWeakened(candidate.patch);
      if (weakened) fallbacks.push(weakened);
      return {
        id: `nl:${index + 1}`,
        patch: candidate.patch,
        confidence: candidate.confidence,
        rationale: candidate.rationale,
        evidence: [`Translated from: ${JSON.stringify(request.utterance)}`],
        enabledByDefault: true,
        sourceRule: 'nl.llm-translation',
        fallbacks,
        requires: []
      };
    }
  );

  const validationCache = new Map<string, LayoutValidationResult>();
  let validated;
  try {
    validated = await resolveValidatedLayout(
      { suggestions, document: {}, spec: '', notes: [] },
      (_spec, document) => {
        const merged = mergeSpecWithPatch(request.currentSpec, document);
        const cached = validationCache.get(merged);
        if (cached) return cached;
        const result = validateCndSpecWithSpytial(merged, instances, core);
        validationCache.set(merged, result);
        return result;
      }
    );
  } catch (error) {
    return failed(
      state,
      `Validation is unavailable or the current spec itself fails: ${failureMessage(error)}`
    );
  }

  const warningsByCandidate = new Map<number, string[]>();
  for (const finding of findings) {
    if (finding.severity !== 'warning' || finding.candidateIndex < 0) continue;
    const list = warningsByCandidate.get(finding.candidateIndex) ?? [];
    list.push(finding.message);
    warningsByCandidate.set(finding.candidateIndex, list);
  }

  const candidates: NlValidatedCandidate[] = response.candidates.map(
    (candidate, index) => {
      const id = `nl:${index + 1}`;
      const decision = validated.decisions.find(
        ({ suggestionId }) => suggestionId === id
      );
      const acceptedPatch =
        validated.suggestions.find((accepted) => accepted.id === id)?.patch ??
        candidate.patch;
      return {
        rationale: candidate.rationale,
        confidence: candidate.confidence,
        patch: acceptedPatch,
        renderedYaml: yaml.dump(acceptedPatch, { lineWidth: -1, noRefs: true }),
        decision: decision?.outcome ?? 'omitted',
        ...(decision?.reason ? { decisionReason: stripHtml(decision.reason) } : {}),
        warnings: warningsByCandidate.get(index) ?? []
      };
    }
  );

  const accepted = candidates.filter(({ decision }) => decision !== 'omitted');
  return {
    status: accepted.length > 0 ? 'ok' : 'failed',
    interpretation: response.interpretation,
    transcript: state.transcript,
    candidates,
    ...(accepted.length > 0
      ? { mergedSpec: mergeSpecWithPatch(request.currentSpec, validated.document) }
      : {}),
    diagnostics:
      accepted.length > 0
        ? state.diagnostics
        : [...state.diagnostics, 'No candidate survived validation.'],
    llmCallsUsed: state.llmCallsUsed
  };
}
