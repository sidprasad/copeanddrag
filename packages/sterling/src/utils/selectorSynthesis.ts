import type { SpytialCoreApi } from './spytialCore';
import type { SpytialDataInstance } from './layoutSuggestions';

/**
 * Selector synthesis adapter for Magic Layout (#143).
 *
 * Magic Layout heuristics decide WHAT should be laid out (a target set of
 * atoms or directed pairs); this module asks spytial-core's selector
 * synthesizer to discover HOW to name that set as a CnD selector expression,
 * then independently verifies the result against every supplied instance
 * before it may enter a candidate.
 *
 * Everything here is pure and synchronous: no React, no Redux, no globals.
 * Synthesis is optional — any missing capability, mismatch, or error returns
 * undefined and the caller falls back to direct selectors. Caller-supplied
 * hint expressions need only the evaluator, so guided candidates still work
 * on a core build without the synthesizer.
 *
 * Verified contract of the core API (spytial-core 3.4.0 browser bundle):
 *  - synthesizeBinarySelector(WithExplanation)(examples, maxDepth) where
 *    examples = [{ pairs: [[srcAtom, dstAtom], ...], dataInstance }] and the
 *    atoms are the OBJECTS from dataInstance.getAtoms(), not id strings;
 *  - returns { expression } or null;
 *  - SGraphQueryEvaluator.evaluate(expr).selectedTuplesAll() returns ordered
 *    [sourceId, targetId] string pairs.
 *
 * Verified behavior of the core synthesizer (#143 Phase 2 probes):
 *  - The search grammar covers identifiers, transpose, union, intersection,
 *    difference, join, and (reflexive) closure, but NOT the arrow product, so
 *    type restrictions such as `f & (A -> A)` can never be synthesized — the
 *    evaluator accepts them, so callers supply them as hint expressions.
 *  - maxDepth 0 only tries shared identifiers plus seeded `Type.rel` /
 *    `rel.Type` joins (milliseconds, even when unsatisfiable).
 *  - An UNSATISFIABLE target costs ~0.5s at depth 1, ~6-8s at depth 2, and
 *    minutes at depth 3 on small instances: the search fans out before it can
 *    fail. Hence the conservative default depth below and the hints-first
 *    policy — call sites should pass the smallest depth their family needs.
 */

export type SelectorExamples =
  | { arity: 1; matchesByInstance: string[][] }
  | { arity: 2; matchesByInstance: Array<Array<[string, string]>> };

export interface SynthesizedSelectorCandidate {
  expression: string;
  /**
   * Where the winning expression came from: 'guided' means a caller-supplied
   * hint expression that verified; 'synthesized' means the core search found
   * it. Provenance feeds suggestion evidence, not acceptance — both sources
   * pass the identical independent verification.
   */
  source: 'guided' | 'synthesized';
  /** Complexity of the expression under expressionCost, for evidence text. */
  cost: number;
}

export interface SynthesizeSelectorOptions {
  /**
   * Maximum expression depth explored by the synthesizer. Defaults to 2: an
   * unsatisfiable depth-2 search costs seconds where depth 3 costs minutes
   * (see header), and every current candidate family's target is expressible
   * at depth <= 2. Pass 0 when the target is known to be outside the search
   * grammar (e.g. arrow-product restrictions) — depth 0 still lets the
   * search propose an extensionally equal declared name.
   */
  maxDepth?: number;
  /**
   * Reject expressions that mention a concrete atom identifier. Automatic
   * suggestions must generalize; an expression naming Node$0 is overfit.
   */
  forbidAtomLiterals?: boolean;
  /**
   * Candidate expressions the caller constructed itself (e.g. `(lc + rc)`,
   * `~boss`, `(f & (A -> A))`). Each is verified against every instance
   * exactly like a synthesized expression. When a hint verifies, the core
   * search still runs at depth 0 — a bare declared name that denotes the
   * same extension should win on readability — but the expensive deep
   * search is skipped.
   */
  hintExpressions?: readonly string[];
  /**
   * Names the automatic search result may not mention (token-boundary).
   * Extensional verification only covers the supplied instances, so a
   * schema-ambiguous name — e.g. a field overloaded across sigs whose other
   * declaration happens to be empty in these instances — can verify here
   * yet denote a broader relation elsewhere. Caller hints are exempt: the
   * caller constructs them to restrict such names deliberately.
   */
  forbidSearchMentions?: readonly string[];
}

/**
 * Deterministic complexity measure used to rank extensionally equivalent
 * selector expressions: identifiers cost 1, most operators cost 1, closures
 * and comprehension machinery cost 2 (they are conceptually heavier for a
 * reader). Parentheses and whitespace are free, so `(lc + rc)` and
 * `lc + rc` tie and the tie-break is stable elsewhere.
 */
export function expressionCost(expression: string): number {
  let cost = 0;
  const charge = (source: string, pattern: RegExp, weight: number): string =>
    source.replace(pattern, () => {
      cost += weight;
      return ' ';
    });
  let rest = expression;
  rest = charge(rest, /[A-Za-z_][\w$/']*/g, 1); // identifiers (seq/Int, Node$0)
  rest = charge(rest, /\d+/g, 1); // numeric literals
  rest = charge(rest, /->/g, 1); // arrow product (before '-')
  rest = charge(rest, /[+&.\-~]/g, 1);
  rest = charge(rest, /[\^*]/g, 2); // closures
  charge(rest, /[{|]/g, 2); // comprehensions
  return cost;
}

/** Instances used for synthesis must expose their atoms (AlloyDataInstance does). */
interface AtomBearingInstance extends SpytialDataInstance {
  getAtoms(): ReadonlyArray<{ id: string }>;
}

function hasAtoms(
  instance: SpytialDataInstance
): instance is AtomBearingInstance {
  return typeof (instance as AtomBearingInstance).getAtoms === 'function';
}

/** Normalize evaluator output entries that may be id strings or atom objects. */
function entryId(entry: unknown): string | undefined {
  if (typeof entry === 'string') return entry;
  if (entry && typeof entry === 'object' && 'id' in entry) {
    const id = (entry as { id: unknown }).id;
    return typeof id === 'string' ? id : undefined;
  }
  return undefined;
}

function pairKey(source: string, target: string): string {
  return `${source}\u0000${target}`;
}

function sameStringSets(left: Set<string>, right: Set<string>): boolean {
  if (left.size !== right.size) return false;
  for (const value of left) if (!right.has(value)) return false;
  return true;
}

/** True when the expression mentions `name` as a standalone token. */
function mentionsName(expression: string, name: string): boolean {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Identifiers may contain $ (Node$0), so a plain \b boundary is not enough.
  return new RegExp(`(^|[^\\w$])${escaped}($|[^\\w$])`).test(expression);
}

/** True when the expression mentions any atom identifier as a standalone token. */
export function mentionsAtomLiteral(
  expression: string,
  instances: readonly SpytialDataInstance[]
): boolean {
  const atomIds = new Set<string>();
  for (const instance of instances) {
    if (!hasAtoms(instance)) continue;
    for (const atom of instance.getAtoms()) atomIds.add(atom.id);
  }
  for (const id of atomIds) {
    if (mentionsName(expression, id)) return true;
  }
  return false;
}

/**
 * Evaluate `expression` on one instance and return its extension as a set of
 * keys (atom ids for arity 1, source/target pair keys for arity 2), or
 * undefined when evaluation fails or the arity does not match.
 */
function evaluateExtension(
  expression: string,
  instance: SpytialDataInstance,
  arity: 1 | 2,
  core: SpytialCoreApi
): Set<string> | undefined {
  if (!core.SGraphQueryEvaluator) return undefined;
  try {
    const evaluator = new core.SGraphQueryEvaluator();
    evaluator.initialize({ sourceData: instance });
    const result = evaluator.evaluate(expression) as {
      selectedAtoms?: () => unknown[];
      selectedTuplesAll?: () => unknown[][];
    };
    const keys = new Set<string>();
    if (arity === 1) {
      const atoms = result.selectedAtoms?.();
      if (!atoms) return undefined;
      for (const atom of atoms) {
        const id = entryId(atom);
        if (id === undefined) return undefined;
        keys.add(id);
      }
      return keys;
    }
    const tuples = result.selectedTuplesAll?.();
    if (!tuples) return undefined;
    for (const tuple of tuples) {
      if (!Array.isArray(tuple) || tuple.length !== 2) return undefined;
      const source = entryId(tuple[0]);
      const target = entryId(tuple[1]);
      if (source === undefined || target === undefined) return undefined;
      keys.add(pairKey(source, target));
    }
    return keys;
  } catch {
    return undefined;
  }
}

function intendedKeys(
  examples: SelectorExamples,
  instanceIndex: number
): Set<string> {
  const keys = new Set<string>();
  if (examples.arity === 1) {
    for (const id of examples.matchesByInstance[instanceIndex] ?? []) {
      keys.add(id);
    }
  } else {
    for (const [source, target] of examples.matchesByInstance[instanceIndex] ??
      []) {
      keys.add(pairKey(source, target));
    }
  }
  return keys;
}

function atomsById(
  instance: AtomBearingInstance
): Map<string, { id: string }> {
  return new Map(instance.getAtoms().map((atom) => [atom.id, atom]));
}

/**
 * Verify that `expression` reproduces the exact intended extension on every
 * instance through the ordinary evaluator, and that it does not overfit to a
 * concrete atom identifier. This is the single acceptance gate for guided
 * and synthesized expressions alike.
 */
function verifiesEverywhere(
  expression: string,
  examples: SelectorExamples,
  instances: readonly SpytialDataInstance[],
  core: SpytialCoreApi,
  forbidAtomLiterals: boolean
): boolean {
  if (forbidAtomLiterals && mentionsAtomLiteral(expression, instances)) {
    return false;
  }
  for (const [index, instance] of instances.entries()) {
    const actual = evaluateExtension(expression, instance, examples.arity, core);
    if (!actual) return false;
    if (!sameStringSets(actual, intendedKeys(examples, index))) {
      return false;
    }
  }
  return true;
}

/** Ask the core synthesizer for one expression matching the examples. */
function invokeCoreSynthesis(
  examples: SelectorExamples,
  atomInstances: readonly AtomBearingInstance[],
  core: SpytialCoreApi,
  maxDepth: number
): string | undefined {
  const synthesizeUnary =
    core.synthesizeAtomSelectorWithExplanation ?? core.synthesizeAtomSelector;
  const synthesizeBinary =
    core.synthesizeBinarySelectorWithExplanation ??
    core.synthesizeBinarySelector;

  let expression: unknown;
  try {
    if (examples.arity === 1) {
      if (!synthesizeUnary) return undefined;
      const apiExamples = atomInstances.map((instance, index) => {
        const byId = atomsById(instance);
        const atoms = (examples.matchesByInstance[index] ?? []).map((id) => {
          const atom = byId.get(id);
          if (!atom) throw new Error(`Unknown atom in examples: ${id}`);
          return atom;
        });
        return { atoms, dataInstance: instance };
      });
      expression = (synthesizeUnary as (e: unknown, d: number) => any)(
        apiExamples,
        maxDepth
      )?.expression;
    } else {
      if (!synthesizeBinary) return undefined;
      const apiExamples = atomInstances.map((instance, index) => {
        const byId = atomsById(instance);
        const pairs = (examples.matchesByInstance[index] ?? []).map(
          ([sourceId, targetId]) => {
            const source = byId.get(sourceId);
            const target = byId.get(targetId);
            if (!source || !target) {
              throw new Error(
                `Unknown atom in examples: ${sourceId} -> ${targetId}`
              );
            }
            return [source, target];
          }
        );
        return { pairs, dataInstance: instance };
      });
      expression = (synthesizeBinary as (e: unknown, d: number) => any)(
        apiExamples,
        maxDepth
      )?.expression;
    }
  } catch {
    return undefined;
  }
  return typeof expression === 'string' && expression.trim() !== ''
    ? expression
    : undefined;
}

/**
 * Find a selector matching the intended extension on every instance, then
 * verify it independently. The intended pairs are ORDERED: (a, b) and (b, a)
 * are different targets, because selectors drive directed layout constraints.
 * Returns undefined on any failure — callers must treat that as ordinary
 * candidate failure, never as an error.
 *
 * Candidate policy (#143 open questions 1-2): caller hints are verified
 * first; the core search then runs at depth 0 when a hint already verified
 * (cheap hunt for an extensionally equal declared name) or at the full
 * depth budget otherwise. Among all verified candidates the lowest
 * expressionCost wins; ties prefer guided over synthesized, then the
 * lexicographically smaller expression, so a bare declared relation always
 * beats an equivalent derived expression on readability.
 */
export function synthesizeAndVerifySelector(
  examples: SelectorExamples,
  instances: readonly SpytialDataInstance[],
  core: SpytialCoreApi | undefined,
  options: SynthesizeSelectorOptions = {}
): SynthesizedSelectorCandidate | undefined {
  const { maxDepth = 2, forbidAtomLiterals = true } = options;
  if (!core?.SGraphQueryEvaluator) return undefined;
  if (instances.length === 0) return undefined;
  if (examples.matchesByInstance.length !== instances.length) return undefined;
  if (!instances.every(hasAtoms)) return undefined;
  const atomInstances = instances as readonly AtomBearingInstance[];

  const candidates: SynthesizedSelectorCandidate[] = [];
  const seen = new Set<string>();
  const addCandidate = (
    expression: string,
    source: 'guided' | 'synthesized'
  ) => {
    if (seen.has(expression)) return;
    seen.add(expression);
    if (
      verifiesEverywhere(
        expression,
        examples,
        instances,
        core,
        forbidAtomLiterals
      )
    ) {
      candidates.push({ expression, source, cost: expressionCost(expression) });
    }
  };

  for (const hint of options.hintExpressions ?? []) {
    if (typeof hint === 'string' && hint.trim() !== '') {
      addCandidate(hint, 'guided');
    }
  }

  const searchDepth = candidates.length > 0 ? 0 : maxDepth;
  const synthesized = invokeCoreSynthesis(
    examples,
    atomInstances,
    core,
    searchDepth
  );
  if (
    synthesized !== undefined &&
    !(options.forbidSearchMentions ?? []).some((name) =>
      mentionsName(synthesized, name)
    )
  ) {
    addCandidate(synthesized, 'synthesized');
  }

  if (candidates.length === 0) return undefined;
  const sourceRank = { guided: 0, synthesized: 1 } as const;
  candidates.sort(
    (left, right) =>
      left.cost - right.cost ||
      sourceRank[left.source] - sourceRank[right.source] ||
      left.expression.localeCompare(right.expression)
  );
  return candidates[0];
}
