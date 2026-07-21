import * as yaml from 'js-yaml';
import { parseCndFile } from './cndPreParser';
import type { SpytialCoreApi } from './spytialCore';

/**
 * Suggestion policy intentionally lives in Cope and Drag rather than calling
 * spytial-core's suggestLayout. CnD owns the Alloy metadata adapter, its
 * additional candidate families, and the fallback/dependency semantics below;
 * core remains the parser, evaluator, projection, and layout execution boundary.
 *
 * Structural subsets of spytial-core's IDataInstance, IRelation, and IType.
 * AlloyDataInstance is assignable to these without changing core's interfaces;
 * source-only declaration metadata stays in RawAlloyInstance below.
 */
export interface SpytialType {
  id: string;
  types: string[];
  atoms: readonly unknown[];
  isBuiltin: boolean;
}

export interface SpytialRelation {
  id: string;
  name: string;
  types: string[];
  tuples: Array<{ atoms: string[]; types: string[] }>;
}

export interface SpytialDataInstance {
  getTypes(): readonly SpytialType[];
  getRelations(): readonly SpytialRelation[];
}

export type SuggestionConfidence = 'high' | 'medium' | 'low';

export interface RawAlloyInstance {
  types: Record<
    string,
    {
      id: string;
      types: string[];
      meta?: {
        abstract?: boolean;
        builtin?: boolean;
        enum?: boolean;
        one?: boolean;
        private?: boolean;
      };
    }
  >;
}

interface TypeFacts {
  instantiable: boolean;
  singleton: boolean;
  enumLike: boolean;
  private: boolean;
}

export interface CndPatch {
  constraints?: Record<string, unknown>[];
  directives?: Record<string, unknown>[];
  projections?: Array<{ sig: string; orderBy?: string }>;
  temporal?: { policy: string };
}

export interface LayoutSuggestion {
  id: string;
  patch: CndPatch;
  confidence: SuggestionConfidence;
  rationale: string;
  evidence: string[];
  enabledByDefault: boolean;
  sourceRule: string;
  /** Weaker forms, strongest first, tried if the primary patch fails. */
  fallbacks: CndPatch[];
  /** Candidate ids that must already have survived validation. */
  requires: string[];
}

export interface LayoutDraft {
  suggestions: LayoutSuggestion[];
  document: CndPatch;
  spec: string;
  notes: string[];
}

export interface LayoutResolutionDecision {
  suggestionId: string;
  outcome: 'applied' | 'weakened' | 'omitted';
  variant: number;
  reason?: string;
}

export interface ValidatedLayoutDraft extends LayoutDraft {
  decisions: LayoutResolutionDecision[];
}

export type LayoutValidationResult =
  | { valid: true }
  | { valid: false; reason: string; unavailable?: boolean };

export type LayoutValidator = (
  spec: string,
  document: CndPatch
) => LayoutValidationResult | Promise<LayoutValidationResult>;

export class LayoutValidationUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LayoutValidationUnavailableError';
  }
}

interface RelationProfile {
  edgeCount: number;
  isBinary: boolean;
  isSelfRelation: boolean;
  isAcyclic: boolean;
  isLinearChain: boolean;
  isSimpleCycle: boolean;
}

interface SuggestLayoutOptions {
  examples?: readonly SpytialDataInstance[];
  rawAlloyInstance?: RawAlloyInstance;
  includePresentation?: boolean;
}

const PALETTE = [
  'steelblue',
  'coral',
  'seagreen',
  'goldenrod',
  'slateblue',
  'firebrick',
  'teal',
  'orchid'
] as const;

function suggestion(
  id: string,
  patch: CndPatch,
  confidence: SuggestionConfidence,
  rationale: string,
  evidence: string[],
  sourceRule: string,
  enabledByDefault = confidence === 'high',
  fallbacks: CndPatch[] = [],
  requires: string[] = []
): LayoutSuggestion {
  return {
    id,
    patch,
    confidence,
    rationale,
    evidence,
    sourceRule,
    enabledByDefault,
    fallbacks,
    requires
  };
}

function schemaFacts(rawInstance?: RawAlloyInstance): Map<string, TypeFacts> {
  const facts = new Map<string, TypeFacts>();
  for (const type of Object.values(rawInstance?.types ?? {})) {
    facts.set(type.id, {
      instantiable: type.meta?.abstract !== true,
      singleton: type.meta?.one === true,
      enumLike: type.meta?.enum === true,
      private: type.meta?.private === true
    });
  }
  return facts;
}

function directSubtypes(
  typeId: string,
  types: readonly SpytialType[]
): SpytialType[] {
  return types.filter((candidate) => candidate.types[1] === typeId);
}

function inferEnums(
  types: readonly SpytialType[],
  facts: ReadonlyMap<string, TypeFacts>
): { all: Set<string>; roots: Set<string> } {
  const all = new Set<string>();
  const roots = new Set<string>();

  for (const type of types) {
    if (type.isBuiltin) continue;
    const children = directSubtypes(type.id, types);
    const typeFacts = facts.get(type.id);
    const magicEnum =
      typeFacts?.instantiable === false &&
      children.length > 0 &&
      children.every((child) => facts.get(child.id)?.singleton === true);
    if (!typeFacts?.enumLike && !magicEnum) continue;

    roots.add(type.id);
    all.add(type.id);
    for (const candidate of types) {
      if (candidate.types.includes(type.id)) all.add(candidate.id);
    }
  }
  return { all, roots };
}

function projectionCandidate(
  types: readonly SpytialType[],
  relations: readonly SpytialRelation[],
  facts: ReadonlyMap<string, TypeFacts>
): { type: SpytialType; score: number; orderBy?: string } | undefined {
  const likelyName = (name: string) =>
    ['State', 'TrainState', 'Time', 'Tick', 'TimeStep'].some(
      (part) => name.startsWith(part) || name.endsWith(part)
    );
  const winner = types
    .filter((type) => !type.isBuiltin && facts.get(type.id)?.private !== true)
    .map((type) => ({
      type,
      score:
        (likelyName(type.id) ? 1 : 0) +
        relations.filter(
          (relation) =>
            relation.types.length > 2 && relation.types.includes(type.id)
        ).length
    }))
    .filter(({ score }) => score >= 2)
    .sort((a, b) => b.score - a.score || a.type.id.localeCompare(b.type.id))[0];
  if (!winner) return undefined;

  const orderRelations = relations.filter(
    (relation) =>
      relation.types.length === 2 &&
      relation.types[0] === winner.type.id &&
      relation.types[1] === winner.type.id
  );
  const orderBy =
    orderRelations.find((relation) =>
      /^(next|succ|successor|ordering)$/i.test(relation.name)
    ) ?? orderRelations[0];
  return { ...winner, ...(orderBy ? { orderBy: orderBy.name } : {}) };
}

function matchingRelation(
  relation: SpytialRelation,
  instance: SpytialDataInstance
): SpytialRelation | undefined {
  return (
    instance.getRelations().find((candidate) => candidate.id === relation.id) ??
    instance
      .getRelations()
      .find(
        (candidate) =>
          candidate.name === relation.name &&
          candidate.types.join('\u0000') === relation.types.join('\u0000')
      )
  );
}

function isFunctional(
  relation: SpytialRelation,
  examples: readonly SpytialDataInstance[]
): boolean {
  if (relation.types.length !== 2) return false;
  return examples.every((example) => {
    const sources = new Set<string>();
    for (const tuple of matchingRelation(relation, example)?.tuples ?? []) {
      const source = tuple.atoms[0];
      if (source === undefined) continue;
      if (sources.has(source)) return false;
      sources.add(source);
    }
    return true;
  });
}

function relationProfile(
  relation: SpytialRelation,
  examples: readonly SpytialDataInstance[]
): RelationProfile {
  const isBinary = relation.types.length === 2;
  const edgeMap = new Map<string, [string, string]>();
  if (isBinary) {
    for (const example of examples) {
      for (const tuple of matchingRelation(relation, example)?.tuples ?? []) {
        const [source, target] = tuple.atoms;
        if (source !== undefined && target !== undefined) {
          edgeMap.set(`${source}\u0000${target}`, [source, target]);
        }
      }
    }
  }
  const edges = [...edgeMap.values()];
  const nodes = new Set(edges.flatMap(([source, target]) => [source, target]));
  const incoming = new Map([...nodes].map((node) => [node, 0]));
  const outgoing = new Map([...nodes].map((node) => [node, [] as string[]]));
  for (const [source, target] of edges) {
    outgoing.get(source)?.push(target);
    incoming.set(target, (incoming.get(target) ?? 0) + 1);
  }

  const undirected = new Map(
    [...nodes].map((node) => [node, new Set<string>()])
  );
  for (const [source, target] of edges) {
    undirected.get(source)?.add(target);
    undirected.get(target)?.add(source);
  }
  const first = nodes.values().next().value as string | undefined;
  const seen = new Set(first ? [first] : []);
  const visit = first ? [first] : [];
  while (visit.length > 0) {
    for (const neighbor of undirected.get(visit.shift()!) ?? []) {
      if (!seen.has(neighbor)) {
        seen.add(neighbor);
        visit.push(neighbor);
      }
    }
  }
  const connected = nodes.size > 0 && seen.size === nodes.size;

  const remainingIncoming = new Map(incoming);
  const roots = [...nodes].filter((node) => remainingIncoming.get(node) === 0);
  const topo = [...roots];
  let visited = 0;
  while (topo.length > 0) {
    const node = topo.shift()!;
    visited += 1;
    for (const target of outgoing.get(node) ?? []) {
      const next = (remainingIncoming.get(target) ?? 0) - 1;
      remainingIncoming.set(target, next);
      if (next === 0) topo.push(target);
    }
  }

  const outdegree = (node: string) => outgoing.get(node)?.length ?? 0;
  const degreeAtMostOne = [...nodes].every(
    (node) => (incoming.get(node) ?? 0) <= 1 && outdegree(node) <= 1
  );
  const leaves = [...nodes].filter((node) => outdegree(node) === 0).length;

  return {
    edgeCount: edges.length,
    isBinary,
    isSelfRelation: isBinary && relation.types[0] === relation.types[1],
    isAcyclic: visited === nodes.size,
    isLinearChain:
      connected &&
      nodes.size > 1 &&
      edges.length === nodes.size - 1 &&
      degreeAtMostOne &&
      roots.length === 1 &&
      leaves === 1,
    isSimpleCycle:
      connected &&
      nodes.size > 1 &&
      edges.length === nodes.size &&
      [...nodes].every(
        (node) => incoming.get(node) === 1 && outdegree(node) === 1
      )
  };
}

function exactTypeSelector(
  type: SpytialType,
  types: readonly SpytialType[]
): string {
  const children = directSubtypes(type.id, types);
  return children.length === 0
    ? type.id
    : `${type.id} - (${children.map((child) => child.id).join(' + ')})`;
}

function topUserType(
  type: SpytialType,
  types: readonly SpytialType[]
): SpytialType {
  const byId = new Map(types.map((candidate) => [candidate.id, candidate]));
  let top = type;
  for (const ancestor of type.types.slice(1)) {
    const candidate = byId.get(ancestor);
    if (!candidate || candidate.isBuiltin) break;
    top = candidate;
  }
  return top;
}

function buildDocument(suggestions: readonly LayoutSuggestion[]): CndPatch {
  const document: CndPatch = {};
  const constraints: Record<string, unknown>[] = [];
  const directives: Record<string, unknown>[] = [];
  const projections: Array<{ sig: string; orderBy?: string }> = [];
  const appendUnique = (
    target: Record<string, unknown>[],
    values?: Record<string, unknown>[]
  ) => {
    for (const value of values ?? []) {
      if (
        !target.some(
          (candidate) => JSON.stringify(candidate) === JSON.stringify(value)
        )
      )
        target.push(value);
    }
  };

  for (const item of suggestions.filter(
    ({ enabledByDefault }) => enabledByDefault
  )) {
    appendUnique(constraints, item.patch.constraints);
    appendUnique(directives, item.patch.directives);
    for (const projection of item.patch.projections ?? []) {
      if (!projections.some(({ sig }) => sig === projection.sig))
        projections.push(projection);
    }
    if (!document.temporal && item.patch.temporal)
      document.temporal = item.patch.temporal;
  }
  if (constraints.length > 0) document.constraints = constraints;
  if (directives.length > 0) document.directives = directives;
  if (projections.length > 0) document.projections = projections;
  return document;
}

function renderDocument(document: CndPatch): string {
  return Object.keys(document).length === 0
    ? ''
    : yaml.dump(document, { lineWidth: -1, noRefs: true });
}

function failureMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Compose the strongest valid CnD spec. Each candidate is tested together
 * with everything already accepted, then weakened or omitted if it fails.
 */
export async function resolveValidatedLayout(
  proposal: LayoutDraft,
  validate: LayoutValidator
): Promise<ValidatedLayoutDraft> {
  const baseline = await validate('', {});
  if (!baseline.valid) {
    if (baseline.unavailable) {
      throw new LayoutValidationUnavailableError(baseline.reason);
    }
    throw new Error(baseline.reason);
  }

  const accepted: LayoutSuggestion[] = [];
  const acceptedIds = new Set<string>();
  const decisions: LayoutResolutionDecision[] = [];
  const confidenceRank: Record<SuggestionConfidence, number> = {
    high: 0,
    medium: 1,
    low: 2
  };
  const candidates = proposal.suggestions
    .map((candidate, index) => ({ candidate, index }))
    .filter(({ candidate }) => candidate.enabledByDefault)
    .sort(
      (left, right) =>
        confidenceRank[left.candidate.confidence] -
          confidenceRank[right.candidate.confidence] || left.index - right.index
    )
    .map(({ candidate }) => candidate);

  for (const candidate of candidates) {
    const missingRequirements = candidate.requires.filter(
      (required) => !acceptedIds.has(required)
    );
    if (missingRequirements.length > 0) {
      decisions.push({
        suggestionId: candidate.id,
        outcome: 'omitted',
        variant: -1,
        reason: `Required suggestion was omitted: ${missingRequirements.join(
          ', '
        )}`
      });
      continue;
    }

    const variants = [candidate.patch, ...candidate.fallbacks];
    let lastReason = 'No valid variant was found.';
    let selected: LayoutSuggestion | undefined;
    let selectedVariant = -1;

    for (const [variant, patch] of variants.entries()) {
      const tentative = { ...candidate, patch };
      const document = buildDocument([...accepted, tentative]);
      const result = await validate(renderDocument(document), document);
      if (!result.valid && result.unavailable) {
        throw new LayoutValidationUnavailableError(result.reason);
      }
      if (result.valid) {
        selected = tentative;
        selectedVariant = variant;
        break;
      }
      lastReason = result.reason;
    }

    if (selected) {
      accepted.push(selected);
      acceptedIds.add(selected.id);
      decisions.push({
        suggestionId: selected.id,
        outcome: selectedVariant === 0 ? 'applied' : 'weakened',
        variant: selectedVariant,
        ...(selectedVariant > 0
          ? {
              reason: `Primary form failed validation; applied fallback ${selectedVariant}.`
            }
          : {})
      });
    } else {
      decisions.push({
        suggestionId: candidate.id,
        outcome: 'omitted',
        variant: -1,
        reason: lastReason
      });
    }
  }

  const document = buildDocument(accepted);
  const omitted = decisions.filter(
    ({ outcome }) => outcome === 'omitted'
  ).length;
  const weakened = decisions.filter(
    ({ outcome }) => outcome === 'weakened'
  ).length;
  return {
    suggestions: accepted,
    document,
    spec: renderDocument(document),
    notes: [
      ...proposal.notes,
      ...(weakened > 0
        ? [`${weakened} suggestion(s) used a weaker fallback.`]
        : []),
      ...(omitted > 0
        ? [`${omitted} suggestion(s) were omitted after validation.`]
        : [])
    ],
    decisions
  };
}

/** Validate a complete generated CnD spec through the real layout pipeline. */
export function validateCndSpecWithSpytial(
  spec: string,
  instances: readonly SpytialDataInstance[],
  core: SpytialCoreApi | undefined
): LayoutValidationResult {
  if (
    instances.length === 0 ||
    !core?.parseLayoutSpec ||
    !core.LayoutInstance ||
    !core.SGraphQueryEvaluator
  ) {
    return {
      valid: false,
      unavailable: true,
      reason: 'The Spytial layout validator is unavailable.'
    };
  }

  try {
    const parsed = parseCndFile(spec);
    if (parsed.sequence.policy !== 'ignore_history') {
      if (!core.getSequencePolicy) {
        return {
          valid: false,
          reason: `Temporal policy ${parsed.sequence.policy} is not supported by this Spytial build.`
        };
      }
      try {
        const policy = core.getSequencePolicy(parsed.sequence.policy);
        if (policy.name !== parsed.sequence.policy) {
          return {
            valid: false,
            reason: `Temporal policy ${parsed.sequence.policy} was not recognized.`
          };
        }
      } catch (error) {
        return {
          valid: false,
          reason: `Temporal policy ${
            parsed.sequence.policy
          } failed validation: ${failureMessage(error)}`
        };
      }
    }

    let layoutSpec: unknown;
    try {
      layoutSpec = core.parseLayoutSpec(parsed.layoutYaml);
    } catch (error) {
      return {
        valid: false,
        reason: `CnD parsing failed: ${failureMessage(error)}`
      };
    }

    for (const [index, instance] of instances.entries()) {
      const evaluator = new core.SGraphQueryEvaluator();
      evaluator.initialize({ sourceData: instance });
      let instanceForLayout: SpytialDataInstance = instance;

      if (parsed.projections.length > 0) {
        if (!core.applyProjectionTransform) {
          return {
            valid: false,
            reason:
              'Projection transforms are not supported by this Spytial build.'
          };
        }
        let orderByError: unknown;
        try {
          const projected = core.applyProjectionTransform(
            instance,
            parsed.projections.map(({ type, orderBy }) => ({
              sig: type,
              ...(orderBy ? { orderBy } : {})
            })),
            {},
            {
              evaluateOrderBy: (selector) =>
                evaluator.evaluate(selector).selectedTwoples(),
              onOrderByError: (_selector, error) => {
                orderByError = error;
              }
            }
          );
          if (orderByError !== undefined) {
            return {
              valid: false,
              reason: `Projection ordering failed in state ${
                index + 1
              }: ${failureMessage(orderByError)}`
            };
          }
          instanceForLayout = projected.instance as SpytialDataInstance;
        } catch (error) {
          return {
            valid: false,
            reason: `Projection failed in state ${index + 1}: ${failureMessage(
              error
            )}`
          };
        }
      }

      try {
        const result = new core.LayoutInstance(
          layoutSpec,
          evaluator,
          index,
          true
        ).generateLayout(instanceForLayout);
        if (result.selectorErrors?.length) {
          return {
            valid: false,
            reason: `A selector failed in state ${index + 1}.`
          };
        }
        if (result.error) {
          return {
            valid: false,
            reason: `Layout failed in state ${index + 1}: ${
              result.error.message
            }`
          };
        }
        if (!result.layout) {
          return {
            valid: false,
            reason: `Spytial produced no layout for state ${index + 1}.`
          };
        }
      } catch (error) {
        return {
          valid: false,
          reason: `Layout failed in state ${index + 1}: ${failureMessage(
            error
          )}`
        };
      }
    }
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      reason: `CnD validation failed: ${failureMessage(error)}`
    };
  }
}

/** Generate a deterministic, explainable CnD draft using Magic Alloy-inspired heuristics. */
export function suggestAlloyLayout(
  instance: SpytialDataInstance,
  options: SuggestLayoutOptions = {}
): LayoutDraft {
  const examples = [
    instance,
    ...(options.examples ?? []).filter((item) => item !== instance)
  ];
  const types = instance.getTypes();
  const relations = instance.getRelations();
  const facts = schemaFacts(options.rawAlloyInstance);
  const enums = inferEnums(types, facts);
  const projection = projectionCandidate(types, relations, facts);
  const suggestions: LayoutSuggestion[] = [
    suggestion(
      'flag:hideDisconnectedBuiltIns',
      { directives: [{ flag: 'hideDisconnectedBuiltIns' }] },
      'high',
      'Hide disconnected solver scaffolding.',
      ['Spytial/Alloy baseline presentation rule'],
      'magic.baseline'
    )
  ];

  if (projection) {
    suggestions.push(
      suggestion(
        `projection:${projection.type.id}`,
        {
          projections: [
            {
              sig: projection.type.id,
              ...(projection.orderBy ? { orderBy: projection.orderBy } : {})
            }
          ]
        },
        projection.score >= 3 ? 'high' : 'medium',
        `Project over ${projection.type.id} to reduce high-arity clutter.`,
        [`Magic projection score ${projection.score}`],
        'magic.projection',
        true,
        projection.orderBy
          ? [{ projections: [{ sig: projection.type.id }] }]
          : []
      )
    );
  }
  if (examples.length > 1) {
    suggestions.push(
      suggestion(
        'temporal:stability',
        { temporal: { policy: 'stability' } },
        'high',
        'Preserve the mental map across representative states.',
        [`${examples.length} states were supplied`],
        'cope.temporal-stability'
      )
    );
  }

  const nonEdgeRelations = new Set<string>();
  const nonEdgeCandidateIds = new Map<string, string>();
  for (const relation of relations) {
    const target = relation.types[1];
    if (
      relation.types.length === 2 &&
      target &&
      enums.all.has(target) &&
      !relation.types.includes(projection?.type.id ?? '')
    ) {
      const candidateId = `attribute:${relation.id}`;
      nonEdgeRelations.add(relation.id);
      nonEdgeCandidateIds.set(relation.id, candidateId);
      suggestions.push(
        suggestion(
          candidateId,
          { directives: [{ attribute: { field: relation.name } }] },
          'high',
          `Render enum-valued field ${relation.name} as an attribute.`,
          [`Target type ${target} is enumeration-like`],
          'magic.enumerations'
        )
      );
    }
  }
  for (const root of enums.roots) {
    const family = new Set(
      types
        .filter((type) => type.id === root || type.types.includes(root))
        .map(({ id }) => id)
    );
    if (
      !relations.some(
        (relation) => relation.types[0] && family.has(relation.types[0])
      )
    ) {
      suggestions.push(
        suggestion(
          `hide-enum:${root}`,
          { directives: [{ hideAtom: { selector: root } }] },
          'high',
          `Hide ${root} nodes after folding enum-valued edges into attributes.`,
          ['The enum family is never the source of a relation'],
          'magic.enumerations',
          true,
          [],
          relations
            .filter(
              (relation) =>
                relation.types.length === 2 &&
                family.has(relation.types[1] ?? '') &&
                nonEdgeRelations.has(relation.id)
            )
            .map((relation) => `attribute:${relation.id}`)
        )
      );
    }
  }

  const builtinIds = new Set(
    types.filter(({ isBuiltin }) => isBuiltin).map(({ id }) => id)
  );
  for (const relation of relations) {
    const target = relation.types[1];
    if (
      relation.types.length === 2 &&
      target &&
      builtinIds.has(target) &&
      isFunctional(relation, examples)
    ) {
      const candidateId = `attribute:${relation.id}`;
      nonEdgeRelations.add(relation.id);
      nonEdgeCandidateIds.set(relation.id, candidateId);
      suggestions.push(
        suggestion(
          candidateId,
          { directives: [{ attribute: { field: relation.name } }] },
          'high',
          `Render functional scalar field ${relation.name} as an attribute.`,
          [
            `Target ${target} is built-in`,
            'At most one target per source in every example'
          ],
          'cope.functional-builtins-as-attributes'
        )
      );
    }
  }
  for (const type of types.filter(
    ({ id, isBuiltin }) => !isBuiltin && id.endsWith('/Ord')
  )) {
    suggestions.push(
      suggestion(
        `hide-ordering:${type.id}`,
        { directives: [{ hideAtom: { selector: type.id } }] },
        'high',
        `Hide ordering implementation type ${type.id}.`,
        ['Type name ends with /Ord'],
        'magic.hide-ordering-scaffold'
      )
    );
  }

  const hasForwardChild = relations.some(({ name }) =>
    ['left', 'right', 'child', 'children', 'next'].includes(name)
  );
  for (const relation of relations.filter(
    (item) => item.types.length === 2 && !enums.all.has(item.types[1] ?? '')
  )) {
    const profile = relationProfile(relation, examples);
    if (relation.name === 'parent') {
      suggestions.push(
        suggestion(
          `orientation:${relation.id}:above`,
          {
            constraints: [
              {
                orientation: { selector: relation.name, directions: ['above'] }
              }
            ]
          },
          hasForwardChild ? 'low' : 'high',
          'Place the target of parent above its source.',
          ['Magic Alloy reverses binary relations named parent'],
          'magic.parent',
          !hasForwardChild
        )
      );
      if (hasForwardChild) {
        const candidateId = `hide-backlink:${relation.id}`;
        nonEdgeRelations.add(relation.id);
        nonEdgeCandidateIds.set(relation.id, candidateId);
        suggestions.push(
          suggestion(
            candidateId,
            { directives: [{ hideField: { field: relation.name } }] },
            'high',
            'Hide the parent back-link because forward child edges already encode it.',
            ['A forward child relation is also present'],
            'magic.parent'
          )
        );
      }
    } else if (relation.name === 'left' || relation.name === 'right') {
      suggestions.push(
        suggestion(
          `orientation:${relation.id}:${relation.name}`,
          {
            constraints: [
              {
                orientation: {
                  selector: relation.name,
                  directions: ['below', relation.name]
                }
              }
            ]
          },
          'high',
          `Place ${relation.name} children below and to the ${relation.name}.`,
          [`Binary structural relation named ${relation.name}`],
          'magic.binary-tree',
          true,
          [
            {
              constraints: [
                {
                  orientation: {
                    selector: relation.name,
                    directions: ['below']
                  }
                }
              ]
            }
          ]
        )
      );
    } else if (profile.isSimpleCycle) {
      suggestions.push(
        suggestion(
          `cyclic:${relation.id}`,
          {
            constraints: [
              { cyclic: { selector: relation.name, direction: 'clockwise' } }
            ]
          },
          'high',
          `Arrange the ${relation.name} ring cyclically.`,
          [
            `Every participating node has one incoming and one outgoing ${relation.name} edge`
          ],
          'cope.topology'
        )
      );
    } else if (profile.isLinearChain) {
      suggestions.push(
        suggestion(
          `orientation:${relation.id}:chain`,
          {
            constraints: [
              {
                orientation: {
                  selector: relation.name,
                  directions: ['directlyRight']
                }
              }
            ]
          },
          'high',
          `Lay the ${relation.name} chain out from left to right.`,
          ['Observed topology is a single linear chain'],
          'cope.topology',
          true,
          [
            {
              constraints: [
                {
                  orientation: {
                    selector: relation.name,
                    directions: ['right']
                  }
                }
              ]
            }
          ]
        )
      );
    } else if (
      profile.isSelfRelation &&
      profile.isAcyclic &&
      profile.edgeCount > 0
    ) {
      suggestions.push(
        suggestion(
          `orientation:${relation.id}:hierarchy`,
          {
            constraints: [
              {
                orientation: { selector: relation.name, directions: ['below'] }
              }
            ]
          },
          'medium',
          `Use ${relation.name} as a top-to-bottom structural spine.`,
          ['Binary self-relation is acyclic'],
          'cope.topology',
          true
        )
      );
    }
  }

  const visibleRelations = relations.filter(
    ({ id, types: relationTypes }) =>
      relationTypes.length === 2 && !nonEdgeRelations.has(id)
  );
  if (visibleRelations.length === 1) {
    const relation = visibleRelations[0]!;
    suggestions.push(
      suggestion(
        `hide-single-edge-label:${relation.id}`,
        {
          directives: [
            { edgeStyle: { field: relation.name, showLabel: false } }
          ]
        },
        'high',
        `Hide the redundant ${relation.name} label because it is the only visible edge relation.`,
        ['Exactly one visible binary relation remains'],
        'magic.single-edge-label',
        true,
        [],
        [...nonEdgeCandidateIds.values()]
      )
    );
  }

  if (options.includePresentation ?? true) {
    const visibleTypes = types.filter(
      (type) =>
        !type.isBuiltin &&
        facts.get(type.id)?.instantiable !== false &&
        facts.get(type.id)?.private !== true
    );
    const colorTargets =
      visibleTypes.length <= 5
        ? visibleTypes
        : [
            ...new Map(
              visibleTypes.map((type) => {
                const top = topUserType(type, types);
                return [top.id, top] as const;
              })
            ).values()
          ];
    colorTargets.forEach((type, index) =>
      suggestions.push(
        suggestion(
          `type-color:${type.id}`,
          {
            directives: [
              {
                atomStyle: {
                  selector:
                    visibleTypes.length <= 5
                      ? exactTypeSelector(type, types)
                      : type.id,
                  borderStyle: { color: PALETTE[index % PALETTE.length] }
                }
              }
            ]
          },
          'medium',
          `Give ${type.id} a stable type-family color.`,
          [
            visibleTypes.length <= 5
              ? 'At most five visible user types'
              : 'Top-level type family'
          ],
          'magic.type-presentation',
          true
        )
      )
    );
  }

  const document = buildDocument(suggestions);
  return {
    suggestions,
    document,
    spec: renderDocument(document),
    notes:
      facts.size === 0
        ? [
            'Alloy declaration metadata was unavailable; enum and cardinality rules were skipped.'
          ]
        : []
  };
}
