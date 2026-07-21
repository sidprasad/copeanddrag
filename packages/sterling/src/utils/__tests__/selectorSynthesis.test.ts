import { describe, expect, it } from '@jest/globals';
import {
  mentionsAtomLiteral,
  synthesizeAndVerifySelector
} from '../selectorSynthesis';
import type { SelectorExamples } from '../selectorSynthesis';
import type { SpytialCoreApi } from '../spytialCore';

/**
 * A miniature relational world standing in for spytial-core: instances are
 * binary relations over atom ids, the evaluator interprets a tiny selector
 * grammar (`rel`, `~rel`, `a + b`), and the synthesizer searches that grammar
 * for an expression matching the first example instance. That makes these
 * tests semantic (real evaluation, real search) without the browser bundle;
 * the installed-bundle contract is covered by the integration suite.
 */

type Pairs = [string, string][];

interface MiniInstance {
  atoms: string[];
  relations: Record<string, Pairs>;
}

function makeInstance(mini: MiniInstance) {
  return {
    getTypes: () => [],
    getRelations: () =>
      Object.entries(mini.relations).map(([name, tuples]) => ({
        id: name,
        name,
        types: ['T', 'T'],
        tuples: tuples.map((atoms) => ({ atoms: [...atoms], types: ['T', 'T'] }))
      })),
    getAtoms: () => mini.atoms.map((id) => ({ id }))
  };
}

function evaluateMini(expression: string, mini: MiniInstance): Pairs {
  const union = expression.match(/^\(?\s*(\w+)\s*\+\s*(\w+)\s*\)?$/);
  if (union) {
    return [
      ...(mini.relations[union[1]!] ?? []),
      ...(mini.relations[union[2]!] ?? [])
    ];
  }
  const transpose = expression.match(/^~\(?(\w+)\)?$/);
  if (transpose) {
    return (mini.relations[transpose[1]!] ?? []).map(([a, b]) => [b, a]);
  }
  const direct = expression.match(/^(\w+)$/);
  if (direct) return mini.relations[direct[1]!] ?? [];
  throw new Error(`mini evaluator cannot parse: ${expression}`);
}

function pairSet(pairs: Pairs): Set<string> {
  return new Set(pairs.map(([a, b]) => `${a} ${b}`));
}

function sameSet(a: Set<string>, b: Set<string>): boolean {
  return a.size === b.size && [...a].every((k) => b.has(k));
}

/** Enumerate the mini grammar and return the first expression matching the example. */
function miniSynthesize(mini: MiniInstance, intended: Pairs): string | null {
  const names = Object.keys(mini.relations);
  const candidates = [
    ...names,
    ...names.map((name) => `~(${name})`),
    ...names.flatMap((a) => names.map((b) => `(${a} + ${b})`))
  ];
  const want = pairSet(intended);
  for (const candidate of candidates) {
    if (sameSet(pairSet(evaluateMini(candidate, mini)), want)) return candidate;
  }
  return null;
}

/** Build a SpytialCoreApi stand-in bound to the instances the test uses. */
function miniCore(
  worlds: Map<unknown, MiniInstance>,
  overrides: Partial<SpytialCoreApi> = {}
): SpytialCoreApi {
  const world = (sourceData: unknown): MiniInstance => {
    const found = worlds.get(sourceData);
    if (!found) throw new Error('unknown instance');
    return found;
  };
  class MiniEvaluator {
    private source: unknown;
    initialize(config: { sourceData: unknown }) {
      this.source = config.sourceData;
    }
    evaluate(expression: string) {
      const pairs = evaluateMini(expression, world(this.source));
      return {
        selectedTuplesAll: () => pairs.map((pair) => [...pair]),
        selectedAtoms: () => []
      };
    }
  }
  return {
    parseLayoutSpec: () => ({}),
    SGraphQueryEvaluator: MiniEvaluator,
    synthesizeBinarySelectorWithExplanation: ((examples: any[]) => {
      const first = examples[0];
      const mini = world(first.dataInstance);
      const intended: Pairs = first.pairs.map((pair: any[]) => [
        pair[0].id,
        pair[1].id
      ]);
      const expression = miniSynthesize(mini, intended);
      return expression ? { expression, explanation: 'mini' } : null;
    }) as any,
    ...overrides
  } as unknown as SpytialCoreApi;
}

function binaryExamples(
  matchesByInstance: Pairs[]
): SelectorExamples {
  return { arity: 2, matchesByInstance };
}

const TREE: MiniInstance = {
  atoms: ['N0', 'N1', 'N2', 'N3', 'N4'],
  relations: {
    lc: [
      ['N0', 'N1'],
      ['N1', 'N3']
    ],
    rc: [
      ['N0', 'N2'],
      ['N1', 'N4']
    ]
  }
};

const PARENTS: MiniInstance = {
  atoms: ['T0', 'T1', 'T2', 'T3'],
  relations: {
    boss: [
      ['T1', 'T0'],
      ['T2', 'T0'],
      ['T3', 'T1']
    ]
  }
};

function setup(minis: MiniInstance[], overrides: Partial<SpytialCoreApi> = {}) {
  const instances = minis.map(makeInstance);
  const worlds = new Map<unknown, MiniInstance>(
    instances.map((instance, index) => [instance, minis[index]!])
  );
  return { instances, core: miniCore(worlds, overrides) };
}

const TREE_UNION: Pairs = [
  ['N0', 'N1'],
  ['N1', 'N3'],
  ['N0', 'N2'],
  ['N1', 'N4']
];

describe('synthesizeAndVerifySelector', () => {
  it('synthesizes and verifies a union selector for a split tree', () => {
    const { instances, core } = setup([TREE]);
    const result = synthesizeAndVerifySelector(
      binaryExamples([TREE_UNION]),
      instances,
      core
    );
    expect(result?.expression).toBe('(lc + rc)');
  });

  it('synthesizes a transpose for reversed examples and stays direction-sensitive', () => {
    const { instances, core } = setup([PARENTS]);
    const reversed = synthesizeAndVerifySelector(
      binaryExamples([
        [
          ['T0', 'T1'],
          ['T0', 'T2'],
          ['T1', 'T3']
        ]
      ]),
      instances,
      core
    );
    expect(reversed?.expression).toBe('~(boss)');

    const forward = synthesizeAndVerifySelector(
      binaryExamples([
        [
          ['T1', 'T0'],
          ['T2', 'T0'],
          ['T3', 'T1']
        ]
      ]),
      instances,
      core
    );
    expect(forward?.expression).toBe('boss');
  });

  it('rejects a synthesized expression that fails independent verification', () => {
    // The synthesizer claims `lc` regardless; the intended set is the union,
    // so per-instance verification must reject it.
    const { instances, core } = setup([TREE], {
      synthesizeBinarySelectorWithExplanation: (() => ({
        expression: 'lc'
      })) as any
    });
    expect(
      synthesizeAndVerifySelector(binaryExamples([TREE_UNION]), instances, core)
    ).toBeUndefined();
  });

  it('rejects when a second instance contradicts the expression', () => {
    // Same relation name, different extension in the second instance; mini
    // synthesis only looks at the first example, verification catches it.
    const secondWorld: MiniInstance = {
      atoms: ['N0', 'N1', 'N2'],
      relations: { lc: [['N0', 'N1']], rc: [['N0', 'N2']] }
    };
    const { instances, core } = setup([TREE, secondWorld]);
    const result = synthesizeAndVerifySelector(
      binaryExamples([
        TREE_UNION,
        [['N0', 'N1']] // intentionally missing rc's edge
      ]),
      instances,
      core
    );
    expect(result).toBeUndefined();
  });

  it('is invariant under permuting the example instances', () => {
    const other: MiniInstance = {
      atoms: ['N0', 'N1', 'N2'],
      relations: {
        lc: [['N0', 'N1']],
        rc: [['N0', 'N2']]
      }
    };
    const intendedA: Pairs = TREE_UNION;
    const intendedB: Pairs = [
      ['N0', 'N1'],
      ['N0', 'N2']
    ];
    const forwardOrder = setup([TREE, other]);
    const reverseOrder = setup([other, TREE]);
    const first = synthesizeAndVerifySelector(
      binaryExamples([intendedA, intendedB]),
      forwardOrder.instances,
      forwardOrder.core
    );
    const second = synthesizeAndVerifySelector(
      binaryExamples([intendedB, intendedA]),
      reverseOrder.instances,
      reverseOrder.core
    );
    expect(first?.expression).toBe('(lc + rc)');
    expect(second?.expression).toBe('(lc + rc)');
  });

  it('is invariant under consistent atom renaming', () => {
    const rename = (id: string) => id.replace('N', 'Zk');
    const renamed: MiniInstance = {
      atoms: TREE.atoms.map(rename),
      relations: Object.fromEntries(
        Object.entries(TREE.relations).map(([name, pairs]) => [
          name,
          pairs.map(([a, b]) => [rename(a), rename(b)] as [string, string])
        ])
      )
    };
    const { instances, core } = setup([renamed]);
    const result = synthesizeAndVerifySelector(
      binaryExamples([
        TREE_UNION.map(([a, b]) => [rename(a), rename(b)] as [string, string])
      ]),
      instances,
      core
    );
    expect(result?.expression).toBe('(lc + rc)');
  });

  it('rejects expressions that mention an atom literal', () => {
    const { instances, core } = setup([TREE], {
      synthesizeBinarySelectorWithExplanation: (() => ({
        // Extensionally correct in the mini world would not matter; the
        // literal guard fires first.
        expression: 'N0 + lc'
      })) as any
    });
    expect(
      synthesizeAndVerifySelector(binaryExamples([TREE_UNION]), instances, core)
    ).toBeUndefined();
  });

  it('fails gracefully on missing or broken capabilities', () => {
    const examples = binaryExamples([TREE_UNION]);

    const noSynth = setup([TREE], {
      synthesizeBinarySelectorWithExplanation: undefined,
      synthesizeBinarySelector: undefined
    });
    expect(
      synthesizeAndVerifySelector(examples, noSynth.instances, noSynth.core)
    ).toBeUndefined();

    expect(
      synthesizeAndVerifySelector(examples, setup([TREE]).instances, undefined)
    ).toBeUndefined();

    const throwing = setup([TREE], {
      synthesizeBinarySelectorWithExplanation: (() => {
        throw new Error('boom');
      }) as any
    });
    expect(
      synthesizeAndVerifySelector(examples, throwing.instances, throwing.core)
    ).toBeUndefined();

    // Instance without getAtoms (plain structural instance).
    const bare = {
      getTypes: () => [],
      getRelations: () => []
    };
    const { core } = setup([TREE]);
    expect(
      synthesizeAndVerifySelector(examples, [bare], core)
    ).toBeUndefined();

    // Examples/instances length mismatch.
    const aligned = setup([TREE]);
    expect(
      synthesizeAndVerifySelector(
        binaryExamples([TREE_UNION, TREE_UNION]),
        aligned.instances,
        aligned.core
      )
    ).toBeUndefined();
  });

  it('preserves arity: binary examples never accept a unary-only evaluator result', () => {
    const { instances, core } = setup([TREE], {
      SGraphQueryEvaluator: class {
        initialize() {}
        evaluate() {
          return { selectedAtoms: () => [{ id: 'N0' }] };
        }
      } as any
    });
    expect(
      synthesizeAndVerifySelector(binaryExamples([TREE_UNION]), instances, core)
    ).toBeUndefined();
  });
});

describe('mentionsAtomLiteral', () => {
  const instances = [makeInstance(TREE)];

  it('detects standalone atom identifiers, including $-forms', () => {
    const dollarWorld = makeInstance({
      atoms: ['Node$0'],
      relations: {}
    });
    expect(mentionsAtomLiteral('N0', instances)).toBe(true);
    expect(mentionsAtomLiteral('(lc + N3)', instances)).toBe(true);
    expect(mentionsAtomLiteral('Node$0 + lc', [dollarWorld])).toBe(true);
  });

  it('does not flag identifiers that merely contain an atom id as a substring', () => {
    expect(mentionsAtomLiteral('lc + rc', instances)).toBe(false);
    // N0x is a different identifier than atom N0.
    expect(mentionsAtomLiteral('N0x', instances)).toBe(false);
  });
});
