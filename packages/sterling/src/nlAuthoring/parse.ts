/**
 * Shape-validate a provider reply into an NlLlmResponse.
 *
 * Providers already return parsed objects (fromTextTransport handles fences
 * and stray prose), so this stage checks STRUCTURE only: the right fields with
 * the right primitive types. Vocabulary-level checking of patches is
 * cndVocabulary.validatePatch's job — keeping the two separate means shape
 * problems and vocabulary problems produce distinct, precise repair feedback.
 */

import type { NlLlmCandidate, NlLlmResponse } from './types';

export type ParsedLlmReply =
  | { ok: true; response: NlLlmResponse }
  | { ok: false; problems: string[] };

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const CONFIDENCE_VALUES = ['high', 'medium', 'low'] as const;

function coerceCandidate(
  value: unknown,
  index: number,
  problems: string[]
): NlLlmCandidate | undefined {
  const label = `candidates[${index}]`;
  const local: string[] = [];
  if (!isPlainObject(value)) {
    problems.push(`${label} must be an object.`);
    return undefined;
  }
  const { rationale, confidence, patch, fallbacks } = value;
  if (typeof rationale !== 'string' || !rationale.trim()) {
    local.push(`${label}.rationale must be a non-empty string.`);
  }
  if (!CONFIDENCE_VALUES.includes(confidence as never)) {
    local.push(
      `${label}.confidence must be one of: ${CONFIDENCE_VALUES.join(', ')}.`
    );
  }
  if (!isPlainObject(patch)) {
    local.push(`${label}.patch must be an object.`);
  }
  if (fallbacks !== undefined) {
    if (!Array.isArray(fallbacks) || !fallbacks.every(isPlainObject)) {
      local.push(`${label}.fallbacks must be an array of patch objects.`);
    }
  }
  if (local.length > 0) {
    problems.push(...local);
    return undefined;
  }
  return {
    rationale: (rationale as string).trim(),
    confidence: confidence as NlLlmCandidate['confidence'],
    patch: patch as NlLlmCandidate['patch'],
    ...(fallbacks !== undefined
      ? { fallbacks: fallbacks as NlLlmCandidate['fallbacks'] }
      : {})
  };
}

/** Validate the reply's shape. All problems are reported, not just the first. */
export function parseLlmReply(value: unknown): ParsedLlmReply {
  if (!isPlainObject(value)) {
    return {
      ok: false,
      problems: ['reply must be a JSON object (not an array or scalar).']
    };
  }
  const problems: string[] = [];

  const interpretation = value.interpretation;
  if (typeof interpretation !== 'string' || !interpretation.trim()) {
    problems.push('"interpretation" must be a non-empty string.');
  }

  const clarification = value.clarification;
  if (
    clarification !== undefined &&
    clarification !== null &&
    typeof clarification !== 'string'
  ) {
    problems.push('"clarification" must be null or a string.');
  }
  const hasClarification =
    typeof clarification === 'string' && clarification.trim().length > 0;

  const rawCandidates = value.candidates;
  const candidates: NlLlmCandidate[] = [];
  if (rawCandidates === undefined && hasClarification) {
    // A pure clarification reply may omit candidates entirely.
  } else if (!Array.isArray(rawCandidates)) {
    problems.push('"candidates" must be an array.');
  } else {
    rawCandidates.forEach((candidate, index) => {
      const coerced = coerceCandidate(candidate, index, problems);
      if (coerced) candidates.push(coerced);
    });
    if (rawCandidates.length === 0 && !hasClarification) {
      problems.push(
        'Provide at least one candidate, or a "clarification" question if the intent is too ambiguous.'
      );
    }
  }

  if (problems.length > 0) {
    return { ok: false, problems };
  }
  return {
    ok: true,
    response: {
      interpretation: (interpretation as string).trim(),
      clarification: hasClarification ? (clarification as string).trim() : null,
      candidates
    }
  };
}
