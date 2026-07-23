import { describe, expect, it } from '@jest/globals';
import * as yaml from 'js-yaml';
import {
  LayoutValidationUnavailableError,
  resolveValidatedLayout,
  suggestAlloyLayout,
  validateCndSpecWithSpytial
} from '../layoutSuggestions';
import type {
  RawAlloyInstance,
  SpytialDataInstance,
  SpytialRelation,
  SpytialType
} from '../layoutSuggestions';
import type { SpytialCoreApi } from '../spytialCore';

function type(
  id: string,
  parents: string[] = ['univ'],
  isBuiltin = false
): SpytialType {
  return { id, types: [id, ...parents], atoms: [], isBuiltin };
}

function relation(
  id: string,
  name: string,
  types: string[],
  tuples: string[][]
): SpytialRelation {
  return {
    id,
    name,
    types,
    tuples: tuples.map((atoms) => ({ atoms, types }))
  };
}

function instance(
  types: SpytialType[],
  relations: SpytialRelation[]
): SpytialDataInstance {
  return {
    getTypes: () => types,
    getRelations: () => relations
  };
}

function raw(types: RawAlloyInstance['types']): RawAlloyInstance {
  return { types };
}

function documentFor(
  data: SpytialDataInstance,
  rawAlloyInstance?: RawAlloyInstance
): Record<string, any> {
  return yaml.load(
    suggestAlloyLayout(data, { rawAlloyInstance }).spec
  ) as Record<string, any>;
}

function pathEdges(size: number, offset = 0): string[][] {
  return Array.from({ length: size - 1 }, (_, index) => [
    `Node$${index + offset}`,
    `Node$${index + offset + 1}`
  ]);
}

function cycleEdges(size: number, offset = 0): string[][] {
  return Array.from({ length: size }, (_, index) => [
    `Node$${index + offset}`,
    `Node$${((index + 1) % size) + offset}`
  ]);
}

function fakeSpytialCore(
  options: {
    seenStates?: number[];
    failState?: number;
    failOrderBy?: boolean;
  } = {}
): SpytialCoreApi {
  return {
    AlloyInstance: { parseAlloyXML: () => ({ instances: [] }) },
    AlloyDataInstance: class {},
    SGraphQueryEvaluator: class {
      initialize() {}
      evaluate(selector: string) {
        if (options.failOrderBy && selector === 'next') {
          throw new Error('bad ordering selector');
        }
        return { selectedTwoples: () => [] };
      }
    },
    parseLayoutSpec: (spec: string) => spec,
    LayoutInstance: class {
      constructor(
        _layoutSpec: unknown,
        _evaluator: unknown,
        private readonly state: number
      ) {}
      generateLayout() {
        options.seenStates?.push(this.state);
        if (options.failState === this.state) {
          return {
            layout: null,
            error: { message: `state ${this.state} failed` }
          };
        }
        return { layout: { state: this.state } };
      }
    },
    applyProjectionTransform: (
      data: SpytialDataInstance,
      projections: Array<{ sig: string; orderBy?: string }>,
      _selections: Record<string, string>,
      transformOptions?: {
        evaluateOrderBy?: (selector: string) => string[][];
        onOrderByError?: (selector: string, error: unknown) => void;
      }
    ) => {
      for (const projection of projections) {
        if (!projection.orderBy) continue;
        try {
          transformOptions?.evaluateOrderBy?.(projection.orderBy);
        } catch (error) {
          transformOptions?.onOrderByError?.(projection.orderBy, error);
        }
      }
      return { instance: data, choices: [] };
    },
    getSequencePolicy: (name: string) => ({ name, apply: () => undefined })
  } as unknown as SpytialCoreApi;
}

describe('Cope layout suggestions', () => {
  it('recognizes every generated directed path as a chain', () => {
    for (let size = 2; size <= 20; size += 1) {
      for (let offset = 0; offset < 3; offset += 1) {
        const name = `link${offset}`;
        const link = relation(
          `Node<:${name}`,
          name,
          ['Node', 'Node'],
          pathEdges(size, offset * 100)
        );
        const document = documentFor(
          instance([type('univ', [], true), type('Node')], [link])
        );

        expect(document.constraints).toContainEqual({
          orientation: { selector: name, directions: ['directlyRight'] }
        });
      }
    }
  });

  it('recognizes every generated simple directed ring as cyclic', () => {
    for (let size = 2; size <= 20; size += 1) {
      const ring = relation(
        'Node<:ring',
        'ring',
        ['Node', 'Node'],
        cycleEdges(size, size * 100)
      );
      const document = documentFor(
        instance([type('univ', [], true), type('Node')], [ring])
      );

      expect(document.constraints).toContainEqual({
        cyclic: { selector: 'ring', direction: 'clockwise' }
      });
    }
  });

  it('does not classify generated branching graphs as chains or rings', () => {
    for (let leaves = 2; leaves <= 12; leaves += 1) {
      const edges = Array.from({ length: leaves }, (_, index) => [
        'Node$0',
        `Node$${index + 1}`
      ]);
      const branch = relation(
        'Node<:branch',
        'branch',
        ['Node', 'Node'],
        edges
      );
      const document = documentFor(
        instance([type('univ', [], true), type('Node')], [branch])
      );

      expect(document.constraints ?? []).not.toContainEqual({
        orientation: { selector: 'branch', directions: ['directlyRight'] }
      });
      expect(document.constraints ?? []).not.toContainEqual({
        cyclic: { selector: 'branch', direction: 'clockwise' }
      });
    }
  });

  it('ignores solver-internal builtin-sourced relations like no-field-guard', () => {
    // Forge emits a sentinel field `no-field-guard` declared on univ itself.
    // It is not part of the model and must not reach any heuristic.
    const data = instance(
      [type('univ', [], true), type('A')],
      [
        relation('univ<:no-field-guard', 'no-field-guard', ['univ', 'univ'], []),
        relation('A<:link', 'link', ['A', 'A'], [['A$0', 'A$1']])
      ]
    );
    const draft = suggestAlloyLayout(data, {});
    expect(JSON.stringify(draft.suggestions)).not.toContain('no-field-guard');
    // The sentinel does not count toward the single-visible-relation rule.
    expect(
      draft.suggestions.some(({ id }) => id === 'hide-single-edge-label:A<:link')
    ).toBe(true);
  });

  it('does not claim an empty builtin-targeted relation is a functional attribute', () => {
    const data = instance(
      [type('Int', [], true), type('A')],
      [relation('A<:size', 'size', ['A', 'Int'], [])]
    );
    const draft = suggestAlloyLayout(data, {});
    expect(
      draft.suggestions.some(({ id }) => id.startsWith('attribute:'))
    ).toBe(false);
  });

  it('reads enum metadata directly from the parsed Alloy instance', () => {
    const types = [
      type('univ', [], true),
      type('Thing'),
      type('Color'),
      type('Red', ['Color', 'univ']),
      type('Blue', ['Color', 'univ'])
    ];
    const color = relation(
      'Thing<:color',
      'color',
      ['Thing', 'Color'],
      [['Thing$0', 'Red$0']]
    );
    const rawInstance = raw({
      Color: {
        id: 'Color',
        types: ['Color', 'univ'],
        meta: { abstract: true }
      },
      Red: { id: 'Red', types: ['Red', 'Color', 'univ'], meta: { one: true } },
      Blue: {
        id: 'Blue',
        types: ['Blue', 'Color', 'univ'],
        meta: { one: true }
      }
    });

    const document = documentFor(instance(types, [color]), rawInstance);

    expect(document.directives).toContainEqual({
      attribute: { field: 'color' }
    });
    expect(document.directives).toContainEqual({
      hideAtom: { selector: 'Color' }
    });
  });

  it('turns generated functional scalar relations into attributes, but rejects duplicates', () => {
    const types = [
      type('univ', [], true),
      type('Node'),
      type('Int', ['univ'], true)
    ];
    for (let sourceCount = 1; sourceCount <= 20; sourceCount += 1) {
      const tuples = Array.from({ length: sourceCount }, (_, index) => [
        `Node$${index}`,
        `${index}`
      ]);
      const value = relation('Node<:value', 'value', ['Node', 'Int'], tuples);
      expect(documentFor(instance(types, [value])).directives).toContainEqual({
        attribute: { field: 'value' }
      });

      const duplicate = relation(
        'Node<:value',
        'value',
        ['Node', 'Int'],
        [...tuples, ['Node$0', `${sourceCount + 1}`]]
      );
      expect(
        documentFor(instance(types, [duplicate])).directives
      ).not.toContainEqual({
        attribute: { field: 'value' }
      });
    }
  });

  it('suggests projection and temporal stability from representative states', () => {
    const types = [type('univ', [], true), type('State'), type('Node')];
    const edge = relation(
      'Node<:edge',
      'edge',
      ['Node', 'Node', 'State'],
      [['Node$0', 'Node$1', 'State$0']]
    );
    const next = relation(
      'State<:next',
      'next',
      ['State', 'State'],
      [['State$0', 'State$1']]
    );
    const primary = instance(types, [edge, next]);

    const draft = suggestAlloyLayout(primary, {
      examples: [instance(types, [edge, next])]
    });
    const document = yaml.load(draft.spec) as Record<string, any>;

    expect(document.projections).toEqual([{ sig: 'State', orderBy: 'next' }]);
    expect(document.temporal).toEqual({ policy: 'stability' });
  });

  it('always projects temporal types, even without higher-arity relations', () => {
    const draft = suggestAlloyLayout(
      instance(
        [type('univ', [], true), type('State'), type('Node')],
        []
      )
    );

    expect(draft.document.projections).toEqual([{ sig: 'State' }]);
  });

  it('projects all temporal and qualifying lone-singleton types', () => {
    const types = [
      type('univ', [], true),
      type('State'),
      type('FrontDesk'),
      type('Room'),
      type('Key')
    ];
    const occupancy = relation(
      'FrontDesk<:occupancy',
      'occupancy',
      ['FrontDesk', 'Room', 'State'],
      [['FrontDesk$0', 'Room$0', 'State$0']]
    );
    const keys = relation(
      'FrontDesk<:keys',
      'keys',
      ['FrontDesk', 'Room', 'Key'],
      [['FrontDesk$0', 'Room$0', 'Key$0']]
    );
    const draft = suggestAlloyLayout(instance(types, [occupancy, keys]), {
      rawAlloyInstance: raw({
        FrontDesk: {
          id: 'FrontDesk',
          types: ['FrontDesk', 'univ'],
          meta: { one: true }
        }
      })
    });

    expect(draft.document.projections).toEqual([
      { sig: 'State' },
      { sig: 'FrontDesk' }
    ]);
  });

  it('adds the best independent higher-arity wrapper to the projection set', () => {
    const types = [
      type('univ', [], true),
      type('State'),
      type('Snapshot'),
      type('Node'),
      type('Value')
    ];
    const changing = relation(
      'Node<:changing',
      'changing',
      ['Node', 'Value', 'State'],
      [['Node$0', 'Value$0', 'State$0']]
    );
    const captured = relation(
      'Snapshot<:captured',
      'captured',
      ['Snapshot', 'Node', 'Value'],
      [['Snapshot$0', 'Node$0', 'Value$0']]
    );

    const draft = suggestAlloyLayout(
      instance(types, [changing, captured])
    );

    expect(draft.document.projections).toEqual([
      { sig: 'State' },
      { sig: 'Snapshot' }
    ]);
  });

  it('does not add a ternary candidate already covered by temporal projection', () => {
    const types = [
      type('univ', [], true),
      type('State'),
      type('Node'),
      type('Value')
    ];
    const changing = relation(
      'Node<:changing',
      'changing',
      ['Node', 'Value', 'State'],
      [['Node$0', 'Value$0', 'State$0']]
    );

    expect(
      suggestAlloyLayout(instance(types, [changing])).document.projections
    ).toEqual([{ sig: 'State' }]);
  });

  it('does not infer presentation colors', () => {
    const draft = suggestAlloyLayout(
      instance(
        [
          type('univ', [], true),
          type('Node'),
          type('Person'),
          type('Place')
        ],
        []
      )
    );

    expect(
      draft.suggestions.some(({ id }) => id.startsWith('type-color:'))
    ).toBe(false);
    expect(draft.document.directives ?? []).not.toContainEqual(
      expect.objectContaining({ atomStyle: expect.anything() })
    );
    expect(draft.spec).not.toContain('borderStyle:');
    expect(draft.spec).not.toContain('fillStyle:');
  });

  it('is deterministic and reports when declaration metadata is unavailable', () => {
    const types = [type('univ', [], true), type('Node')];
    const edges = pathEdges(12);
    const baseline = suggestAlloyLayout(
      instance(types, [relation('Node<:link', 'link', ['Node', 'Node'], edges)])
    );

    for (let rotation = 0; rotation < edges.length; rotation += 1) {
      const permuted = [...edges.slice(rotation), ...edges.slice(0, rotation)];
      const candidate = suggestAlloyLayout(
        instance(types, [
          relation('Node<:link', 'link', ['Node', 'Node'], permuted)
        ])
      );
      expect(candidate.spec).toBe(baseline.spec);
    }
    expect(baseline.notes).toHaveLength(1);
  });

  it('weakens invalid strong forms and returns a composition the validator accepted', async () => {
    for (let size = 2; size <= 20; size += 1) {
      const name = `link${size}`;
      const proposal = suggestAlloyLayout(
        instance(
          [type('univ', [], true), type('Node')],
          [relation(`Node<:${name}`, name, ['Node', 'Node'], pathEdges(size))]
        )
      );
      const acceptedSpecs = new Set<string>();
      const resolved = await resolveValidatedLayout(proposal, (spec) => {
        const valid = !spec.includes('directlyRight');
        if (valid) acceptedSpecs.add(spec);
        return valid
          ? { valid: true }
          : { valid: false, reason: 'direct alignment is unsatisfiable' };
      });

      expect(resolved.document.constraints).toContainEqual({
        orientation: { selector: name, directions: ['right'] }
      });
      expect(resolved.spec).not.toContain('directlyRight');
      expect(acceptedSpecs.has(resolved.spec)).toBe(true);
      expect(resolved.decisions).toContainEqual(
        expect.objectContaining({
          suggestionId: `orientation:Node<:${name}:chain`,
          outcome: 'weakened',
          variant: 1
        })
      );
    }
  });

  it('never hides an enum when the required attribute conversion is rejected', async () => {
    const types = [
      type('univ', [], true),
      type('Thing'),
      type('Color'),
      type('Red', ['Color', 'univ']),
      type('Blue', ['Color', 'univ'])
    ];
    const color = relation(
      'Thing<:color',
      'color',
      ['Thing', 'Color'],
      [['Thing$0', 'Red$0']]
    );
    const proposal = suggestAlloyLayout(instance(types, [color]), {
      rawAlloyInstance: raw({
        Color: {
          id: 'Color',
          types: ['Color', 'univ'],
          meta: { abstract: true }
        },
        Red: {
          id: 'Red',
          types: ['Red', 'Color', 'univ'],
          meta: { one: true }
        },
        Blue: {
          id: 'Blue',
          types: ['Blue', 'Color', 'univ'],
          meta: { one: true }
        }
      })
    });
    const resolved = await resolveValidatedLayout(proposal, (spec) =>
      spec.includes('attribute:')
        ? { valid: false, reason: 'attribute selector failed' }
        : { valid: true }
    );

    expect(resolved.spec).not.toContain('attribute:');
    expect(resolved.spec).not.toContain('hideAtom:');
    expect(resolved.decisions).toContainEqual(
      expect.objectContaining({
        suggestionId: 'hide-enum:Color',
        outcome: 'omitted'
      })
    );
  });

  it('does not produce a replacement when validation is unavailable', async () => {
    const proposal = suggestAlloyLayout(
      instance([type('univ', [], true), type('Node')], [])
    );
    await expect(
      resolveValidatedLayout(proposal, () => ({
        valid: false,
        unavailable: true,
        reason: 'validator unavailable'
      }))
    ).rejects.toBeInstanceOf(LayoutValidationUnavailableError);
  });

  it('surfaces an ordinary empty-layout failure without calling validation unavailable', async () => {
    const proposal = suggestAlloyLayout(
      instance([type('univ', [], true), type('Node')], [])
    );
    const resolution = resolveValidatedLayout(proposal, () => ({
      valid: false,
      reason: 'the empty layout failed'
    }));

    await expect(resolution).rejects.toThrow('the empty layout failed');
    await expect(resolution).rejects.not.toBeInstanceOf(
      LayoutValidationUnavailableError
    );
  });

  it('lets high-confidence candidates win over conflicting medium candidates', async () => {
    const types = [
      type('univ', [], true),
      type('Wrapper'),
      type('Node'),
      type('Value')
    ];
    const values = relation(
      'Wrapper<:values',
      'values',
      ['Wrapper', 'Node', 'Value'],
      [['Wrapper$0', 'Node$0', 'Value$0']]
    );
    const primary = instance(types, [values]);
    const proposal = suggestAlloyLayout(primary, {
      examples: [instance(types, [values])]
    });
    const resolved = await resolveValidatedLayout(proposal, (_spec, document) =>
      document.temporal && document.projections
        ? { valid: false, reason: 'projection conflicts with temporal policy' }
        : { valid: true }
    );

    expect(resolved.document.temporal).toEqual({ policy: 'stability' });
    expect(resolved.document.projections).toBeUndefined();
    expect(resolved.decisions).toContainEqual(
      expect.objectContaining({
        suggestionId: 'projection:Wrapper',
        outcome: 'omitted'
      })
    );
  });

  it('runs the complete parser/evaluator/layout pipeline for every state', () => {
    for (let stateCount = 1; stateCount <= 12; stateCount += 1) {
      const seenStates: number[] = [];
      const states = Array.from({ length: stateCount }, () =>
        instance([type('univ', [], true), type('Node')], [])
      );
      const result = validateCndSpecWithSpytial(
        'directives:\n  - flag: hideDisconnectedBuiltIns\n',
        states,
        fakeSpytialCore({ seenStates })
      );

      expect(result).toEqual({ valid: true });
      expect(seenStates).toEqual(
        Array.from({ length: stateCount }, (_, index) => index)
      );
    }
  });

  it('rejects a candidate when any representative state fails layout', () => {
    const states = Array.from({ length: 5 }, () =>
      instance([type('univ', [], true), type('Node')], [])
    );
    const result = validateCndSpecWithSpytial(
      'constraints: []\n',
      states,
      fakeSpytialCore({ failState: 3 })
    );

    expect(result).toEqual({
      valid: false,
      reason: 'Layout failed in state 4: state 3 failed'
    });
  });

  it('falls back from an invalid projection order while preserving projection', async () => {
    const types = [type('univ', [], true), type('State'), type('Node')];
    const edge = relation(
      'Node<:edge',
      'edge',
      ['Node', 'Node', 'State'],
      [['Node$0', 'Node$1', 'State$0']]
    );
    const next = relation(
      'State<:next',
      'next',
      ['State', 'State'],
      [['State$0', 'State$1']]
    );
    const data = instance(types, [edge, next]);
    const proposal = suggestAlloyLayout(data);
    const core = fakeSpytialCore({ failOrderBy: true });
    const resolved = await resolveValidatedLayout(proposal, (spec) =>
      validateCndSpecWithSpytial(spec, [data], core)
    );

    expect(resolved.document.projections).toEqual([{ sig: 'State' }]);
    expect(resolved.decisions).toContainEqual(
      expect.objectContaining({
        suggestionId: 'projection:State',
        outcome: 'weakened',
        variant: 1
      })
    );
  });

  it('counts only rendered binary edges for the single-label heuristic', async () => {
    const types = [
      type('univ', [], true),
      type('Node'),
      type('State'),
      type('Int', ['univ'], true)
    ];
    for (let size = 2; size <= 12; size += 1) {
      const link = relation(
        'Node<:link',
        'link',
        ['Node', 'Node'],
        pathEdges(size)
      );
      const value = relation(
        'Node<:value',
        'value',
        ['Node', 'Int'],
        Array.from({ length: size }, (_, index) => [
          `Node$${index}`,
          `${index}`
        ])
      );
      const history = relation(
        'Node<:history',
        'history',
        ['Node', 'Node', 'State'],
        [['Node$0', 'Node$1', 'State$0']]
      );
      const proposal = suggestAlloyLayout(
        instance(types, [link, value, history])
      );
      const resolved = await resolveValidatedLayout(proposal, () => ({
        valid: true
      }));

      expect(resolved.document.directives).toContainEqual({
        edgeStyle: { field: 'link', showLabel: false }
      });

      const withoutAttribute = await resolveValidatedLayout(proposal, (spec) =>
        spec.includes('attribute:')
          ? { valid: false, reason: 'attribute conversion failed' }
          : { valid: true }
      );
      expect(withoutAttribute.document.directives ?? []).not.toContainEqual({
        edgeStyle: { field: 'link', showLabel: false }
      });
    }
  });
});
