import { describe, expect, it } from '@jest/globals';
import {
  collectFieldRefSites,
  collectSelectorSites,
  validatePatch
} from '../cndVocabulary';

describe('validatePatch', () => {
  it('accepts a clean orientation + attribute patch', () => {
    expect(
      validatePatch({
        constraints: [
          { orientation: { selector: 'left + right', directions: ['below'] } }
        ],
        directives: [{ attribute: { field: 'val' } }]
      })
    ).toEqual([]);
  });

  it('rejects an unknown constraint key, naming the allowed ones', () => {
    const problems = validatePatch({
      constraints: [{ position: { selector: 'x' } }]
    });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('unknown constraint "position"');
    expect(problems[0]).toContain('orientation');
  });

  it('rejects the builder-internal and legacy names', () => {
    const problems = validatePatch({
      constraints: [{ groupselector: { selector: 'x' } }],
      directives: [{ atomColor: { selector: 'x', value: 'red' } }]
    });
    expect(problems.some((p) => p.includes('groupselector'))).toBe(true);
    expect(problems.some((p) => p.includes('atomColor'))).toBe(true);
  });

  it('rejects a direction outside the enum', () => {
    const problems = validatePatch({
      constraints: [
        { orientation: { selector: 'f', directions: ['beneath'] } }
      ]
    });
    expect(problems.some((p) => p.includes('"beneath"'))).toBe(true);
  });

  it('rejects contradictory direction combinations', () => {
    const problems = validatePatch({
      constraints: [
        { orientation: { selector: 'f', directions: ['above', 'below'] } }
      ]
    });
    expect(problems.some((p) => p.includes('cannot combine'))).toBe(true);
  });

  it('allows directly* only with its plain counterpart', () => {
    expect(
      validatePatch({
        constraints: [
          {
            orientation: {
              selector: 'f',
              directions: ['directlyAbove', 'above']
            }
          }
        ]
      })
    ).toEqual([]);
    const problems = validatePatch({
      constraints: [
        {
          orientation: { selector: 'f', directions: ['directlyAbove', 'left'] }
        }
      ]
    });
    expect(problems.some((p) => p.includes('directlyAbove'))).toBe(true);
  });

  it('requires a group name unless hold is never', () => {
    expect(
      validatePatch({
        constraints: [{ group: { selector: 'Team.members', hold: 'never' } }]
      })
    ).toEqual([]);
    const problems = validatePatch({
      constraints: [{ group: { selector: 'Team.members' } }]
    });
    expect(problems.some((p) => p.includes('"name" is required'))).toBe(true);
  });

  it('validates field-form groups by their own rules', () => {
    expect(
      validatePatch({
        constraints: [
          { group: { field: 'worksIn', groupOn: 1, addToGroup: 0 } }
        ]
      })
    ).toEqual([]);
    const problems = validatePatch({
      constraints: [{ group: { field: 'worksIn', groupOn: 1 } }]
    });
    expect(problems.some((p) => p.includes('addToGroup'))).toBe(true);
  });

  it('treats flag as a bare string from the closed set', () => {
    expect(
      validatePatch({ directives: [{ flag: 'hideDisconnected' }] })
    ).toEqual([]);
    const problems = validatePatch({
      directives: [{ flag: 'hideEverything' }]
    });
    expect(problems.some((p) => p.includes('hideDisconnected'))).toBe(true);
  });

  it('rejects unknown fields inside a known form', () => {
    const problems = validatePatch({
      constraints: [
        {
          orientation: {
            selector: 'f',
            directions: ['above'],
            strength: 'high'
          }
        }
      ]
    });
    expect(problems.some((p) => p.includes('unknown field "strength"'))).toBe(
      true
    );
  });

  it('rejects an empty patch', () => {
    expect(validatePatch({}).length).toBeGreaterThan(0);
  });
});

describe('collectSelectorSites', () => {
  it('collects expressions with expected arities and contexts', () => {
    const sites = collectSelectorSites({
      constraints: [
        { orientation: { selector: 'left + right', directions: ['below'] } },
        { align: { selector: 'Leaf', direction: 'horizontal' } }
      ],
      directives: [
        { edgeStyle: { field: 'next', filter: 'next & (A -> A)' } },
        { tag: { toTag: 'Person', name: 'age', value: 'age' } },
        { flag: 'hideDisconnected' }
      ]
    });
    expect(sites).toEqual([
      {
        expression: 'left + right',
        context: 'constraint 1 (orientation) selector',
        expectedArity: 2
      },
      { expression: 'Leaf', context: 'constraint 2 (align) selector' },
      {
        expression: 'next & (A -> A)',
        context: 'directive 1 (edgeStyle) filter'
      },
      {
        expression: 'Person',
        context: 'directive 2 (tag) toTag',
        expectedArity: 1
      },
      { expression: 'age', context: 'directive 2 (tag) value' }
    ]);
  });
});

describe('collectFieldRefSites', () => {
  it('collects field-name references from field-bearing forms', () => {
    const sites = collectFieldRefSites({
      constraints: [{ group: { field: 'worksIn', groupOn: 1, addToGroup: 0 } }],
      directives: [
        { attribute: { field: 'val' } },
        { hideField: { field: 'internal' } }
      ]
    });
    expect(sites.map(({ field }) => field)).toEqual([
      'worksIn',
      'val',
      'internal'
    ]);
  });
});
