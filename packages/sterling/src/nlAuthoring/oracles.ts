/**
 * The staged validation oracles for LLM-produced patches.
 *
 * Ordered cheap → expensive, every stage yields structured NlFindings whose
 * messages carry the underlying tool's reason verbatim — that precision is
 * what makes the repair loop converge. validateCndSpecWithSpytial is NOT used
 * here (it collapses errors to short strings for the mechanical-salvage pass);
 * collectSpecFindings mirrors its pipeline but keeps the details.
 */

import * as yaml from 'js-yaml';
import { parseCndFile } from '../utils/cndPreParser';
import type { CndPatch, SpytialDataInstance } from '../utils/layoutSuggestions';
import { getForgeStaticAnalyzer } from '../utils/spytialCore';
import type { SpytialCoreApi } from '../utils/spytialCore';
import {
  collectFieldRefSites,
  collectSelectorSites,
  validatePatch
} from './cndVocabulary';
import type { NlFinding } from './types';

export interface OracleDeps {
  core: SpytialCoreApi;
  instances: readonly SpytialDataInstance[];
}

const asRecordArray = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? value.filter((item) => item && typeof item === 'object') : [];

/**
 * Merge a candidate patch into the spec currently in the editor. Constraints
 * and directives append (exact duplicates dropped); projections/temporal keep
 * the current spec's blocks, adopting the patch's only where absent. An
 * unparseable current spec passes through untouched semantics-wise: the
 * validator will surface its problems against the baseline.
 */
export function mergeSpecWithPatch(currentSpec: string, patch: CndPatch): string {
  let current: Record<string, unknown> = {};
  if (currentSpec.trim()) {
    try {
      const parsed = yaml.load(currentSpec);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        current = parsed as Record<string, unknown>;
      }
    } catch {
      // Leave `current` empty; the baseline validation of currentSpec itself
      // is the engine's responsibility, not the merge's.
    }
  }

  const merged: Record<string, unknown> = { ...current };
  for (const key of ['constraints', 'directives'] as const) {
    const existing = asRecordArray(current[key]);
    const additions = asRecordArray(patch[key]);
    const seen = new Set(existing.map((entry) => JSON.stringify(entry)));
    const appended = [
      ...existing,
      ...additions.filter((entry) => !seen.has(JSON.stringify(entry)))
    ];
    if (appended.length > 0) merged[key] = appended;
  }
  if (merged.projections === undefined && patch.projections?.length) {
    merged.projections = patch.projections;
  }
  if (merged.temporal === undefined && patch.temporal) {
    merged.temporal = patch.temporal;
  }

  return Object.keys(merged).length === 0
    ? ''
    : yaml.dump(merged, { lineWidth: -1, noRefs: true });
}

function knownFieldNames(instances: readonly SpytialDataInstance[]): Set<string> {
  const names = new Set<string>();
  for (const instance of instances) {
    for (const relation of instance.getRelations()) {
      names.add(relation.name);
    }
  }
  return names;
}

function evaluationErrorMessage(result: {
  prettyPrint(): string;
  getRawResult?: () => unknown;
}): string {
  const raw = result.getRawResult?.() as { error?: { message?: string } } | undefined;
  if (raw?.error?.message) return raw.error.message;
  try {
    return result.prettyPrint();
  } catch {
    return 'evaluation failed';
  }
}

/**
 * Stages 2–4 for one candidate patch: vocabulary, schema field names, static
 * selector analysis, and per-instance selector evaluation.
 */
export function collectPatchFindings(
  candidateIndex: number,
  patch: CndPatch,
  deps: OracleDeps
): NlFinding[] {
  const findings: NlFinding[] = [];
  const blocking = (stage: NlFinding['stage'], message: string) =>
    findings.push({ candidateIndex, severity: 'blocking', stage, message });
  const warning = (stage: NlFinding['stage'], message: string) =>
    findings.push({ candidateIndex, severity: 'warning', stage, message });

  // Stage 2: vocabulary. Structural problems make the later stages
  // meaningless for this candidate, so stop here when any are found.
  const vocabularyProblems = validatePatch(patch);
  if (vocabularyProblems.length > 0) {
    for (const problem of vocabularyProblems) blocking('vocabulary', problem);
    return findings;
  }

  // Stage 3a: field NAMES must exist in the schema (they are not expressions,
  // so no other stage would catch a typo like `field: lft`).
  const fields = knownFieldNames(deps.instances);
  for (const site of collectFieldRefSites(patch)) {
    if (!fields.has(site.field)) {
      blocking(
        'static',
        `${site.context}: field "${site.field}" does not exist. Known fields: ${[...fields].join(', ') || '(none)'}.`
      );
    }
  }

  const sites = collectSelectorSites(patch);
  const primary = deps.instances[0];

  // Stage 3b: static analysis. Only definite negative verdicts are findings —
  // 'unknown' doubles as "no problem found" (and does NOT catch bad names;
  // evaluation below does).
  const staticallyFlagged = new Set<string>();
  const analyze = getForgeStaticAnalyzer(deps.core);
  if (analyze && primary) {
    for (const site of sites) {
      let verdict;
      try {
        verdict = analyze(site.expression, primary as never);
      } catch {
        continue;
      }
      if (verdict.status === 'unsat' || verdict.status === 'empty' || verdict.status === 'ill-typed') {
        blocking(
          'static',
          `${site.context}: \`${site.expression}\` is ${verdict.status}: ${verdict.reason}`
        );
        staticallyFlagged.add(site.context);
      } else if (verdict.status === 'tautology') {
        warning(
          'static',
          `${site.context}: \`${site.expression}\` is a tautology: ${verdict.reason}`
        );
      }
    }
  }

  // Stage 4: evaluate each selector on every state. A selector already flagged
  // statically is skipped — one precise message beats two overlapping ones.
  if (deps.core.SGraphQueryEvaluator) {
    for (const site of sites) {
      if (staticallyFlagged.has(site.context)) continue;
      let emptyEverywhere = true;
      let flagged = false;
      for (const [stateIndex, instance] of deps.instances.entries()) {
        let result;
        try {
          const evaluator = new deps.core.SGraphQueryEvaluator();
          evaluator.initialize({ sourceData: instance });
          result = evaluator.evaluate(site.expression);
        } catch (error) {
          blocking(
            'evaluation',
            `${site.context}: \`${site.expression}\` failed to evaluate: ${error instanceof Error ? error.message : String(error)}`
          );
          flagged = true;
          break;
        }
        if (result.isError()) {
          blocking(
            'evaluation',
            `${site.context}: \`${site.expression}\` failed in state ${stateIndex + 1}: ${evaluationErrorMessage(result)}`
          );
          flagged = true;
          break;
        }
        if (!result.noResult()) {
          emptyEverywhere = false;
          if (
            site.expectedArity !== undefined &&
            result.maxArity() !== site.expectedArity
          ) {
            blocking(
              'evaluation',
              `${site.context}: \`${site.expression}\` returns tuples of arity ${result.maxArity()}, but this form needs arity ${site.expectedArity} (${site.expectedArity === 2 ? 'source -> target pairs' : 'single atoms'}).`
            );
            flagged = true;
            break;
          }
        }
      }
      if (!flagged && emptyEverywhere && deps.instances.length > 0) {
        warning(
          'evaluation',
          `${site.context}: \`${site.expression}\` matches nothing in any state; this entry would have no effect.`
        );
      }
    }
  }

  return findings;
}

/**
 * Solver messages embed HTML for core's own error modal (<span data-node-id>
 * atom chips). Both the repair prompt and the preview dialog want plain text.
 */
export function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function describeConflicts(errorMessages: unknown): string | undefined {
  if (!errorMessages || typeof errorMessages !== 'object') return undefined;
  const conflicts = (errorMessages as { minimalConflictingConstraints?: unknown })
    .minimalConflictingConstraints;
  if (!conflicts) return undefined;
  const entries: Array<[string, unknown]> =
    conflicts instanceof Map
      ? [...conflicts.entries()]
      : Object.entries(conflicts as Record<string, unknown>);
  if (entries.length === 0) return undefined;
  const parts = entries.map(([constraint, others]) => {
    const list = Array.isArray(others) ? others.join('; ') : String(others);
    return `${stripHtml(constraint)} conflicts with: ${stripHtml(list)}`;
  });
  return `These constraints cannot hold together — ${parts.join(' | ')}`;
}

/**
 * Stage 5: run the real layout pipeline on a complete (already merged) spec,
 * keeping full error details. Mirrors validateCndSpecWithSpytial's flow.
 */
export function collectSpecFindings(
  spec: string,
  candidateIndex: number,
  deps: OracleDeps
): NlFinding[] {
  const findings: NlFinding[] = [];
  const blocking = (message: string) =>
    findings.push({ candidateIndex, severity: 'blocking', stage: 'layout', message });
  const { core, instances } = deps;
  if (!core.parseLayoutSpec || !core.LayoutInstance || !core.SGraphQueryEvaluator) {
    return findings;
  }

  const parsed = parseCndFile(spec);
  let layoutSpec: unknown;
  try {
    layoutSpec = core.parseLayoutSpec(parsed.layoutYaml);
  } catch (error) {
    blocking(
      `the merged spec fails to parse: ${error instanceof Error ? error.message : String(error)}`
    );
    return findings;
  }
  const warnings = (layoutSpec as { warnings?: Array<{ code: string; message: string }> })
    ?.warnings;
  for (const specWarning of warnings ?? []) {
    findings.push({
      candidateIndex,
      severity: 'warning',
      stage: 'layout',
      message: `spec warning (${specWarning.code}): ${specWarning.message}`
    });
  }

  for (const [stateIndex, instance] of instances.entries()) {
    try {
      const evaluator = new core.SGraphQueryEvaluator();
      evaluator.initialize({ sourceData: instance });
      const result = new core.LayoutInstance(
        layoutSpec,
        evaluator,
        stateIndex,
        true
      ).generateLayout(instance);
      for (const selectorError of result.selectorErrors ?? []) {
        const detail = selectorError as {
          selector?: string;
          context?: string;
          errorMessage?: string;
        };
        blocking(
          `selector \`${detail.selector ?? '?'}\` (${detail.context ?? 'unknown context'}) failed in state ${stateIndex + 1}: ${stripHtml(detail.errorMessage ?? 'unknown error')}`
        );
      }
      if (result.error) {
        const conflict = describeConflicts(result.error.errorMessages);
        blocking(
          `layout failed in state ${stateIndex + 1}: ${stripHtml(result.error.message)}${conflict ? ` — ${conflict}` : ''}`
        );
      } else if (!result.layout && (result.selectorErrors ?? []).length === 0) {
        blocking(`no layout was produced for state ${stateIndex + 1}.`);
      }
    } catch (error) {
      blocking(
        `layout failed in state ${stateIndex + 1}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    // One bad state gives the model enough to work with; later states
    // usually repeat the same failure.
    if (findings.some(({ severity }) => severity === 'blocking')) break;
  }
  return findings;
}
