import { sourceLocation, presentViolation } from '../nearMissEvidence';

const formula = {
  text: 'all d: Disk | lone d.copies',
  predicate: 'separated',
  file: '/models/storage.frg',
  line: 5
};

it('identifies the source rule and handles formulas without a source location', () => {
  expect(sourceLocation(formula)).toBe('storage.frg:5');
  expect(
    sourceLocation({
      text: 'no Disk',
      predicate: false,
      file: false,
      line: false
    })
  ).toBeUndefined();
});

it('uses the same sample for the explanation and the directed field highlights', () => {
  const replicas = Array.from({ length: 9 }, (_, i) => [`Replica${i}`]);
  const { bindings, evaluations, caseCount, atoms, edges } = presentViolation({
    formula,
    cases: [
      {
        bindings: [{ variable: 'd', atom: 'Disk0' }],
        evaluations: [
          {
            expression: 'Disk0.copies',
            value: replicas,
            multiplicity: 'lone',
            relation: 'copies',
            tuples: replicas.map((row) => ['Disk0', ...row])
          }
        ]
      },
      { bindings: [{ variable: 'd', atom: 'Disk1' }], evaluations: [] }
    ]
  });
  expect(bindings).toEqual([{ variable: 'd', atom: 'Disk0' }]);
  expect(caseCount).toBe(2);
  expect(evaluations).toEqual([
    {
      expression: 'Disk0.copies',
      valueText:
        'Replica0 + Replica1 + Replica2 + Replica3 + Replica4 + Replica5 + Replica6 + Replica7',
      omitted: 1,
      total: 9,
      multiplicity: 'lone',
      cardinality: 'This value contains 9 atoms.'
    }
  ]);
  expect(edges).toEqual(
    replicas
      .slice(0, 8)
      .map(([target]) => ({ relation: 'copies', source: 'Disk0', target }))
  );
  expect(atoms).toEqual(['Disk0', ...replicas.slice(0, 8).flat()]);
});

it('keeps derived pairs, ternary field tuples, and empty fields out of the binary edge highlights', () => {
  const { evaluations, edges, atoms } = presentViolation({
    formula,
    cases: [
      {
        bindings: [{ variable: 'r', atom: 0 }],
        evaluations: [
          { expression: '^next', value: [['A', 'B']] },
          {
            expression: 'entries',
            value: [['A', 0, 'C']],
            relation: 'entries',
            tuples: [['A', 0, 'C']]
          },
          {
            expression: 'copies.r',
            multiplicity: 'some',
            value: [],
            relation: 'copies',
            tuples: []
          },
          { expression: 'some copies', value: false }
        ]
      }
    ]
  });
  expect(edges).toEqual([]);
  expect(atoms).toEqual(['0', 'A', 'B', 'C']);
  expect(evaluations.map((e) => e.valueText)).toEqual([
    'A -> B',
    'A -> 0 -> C',
    'none',
    'false'
  ]);
  expect(evaluations[2]).toMatchObject({
    multiplicity: 'some',
    cardinality: 'This value is empty.',
    total: 0,
    omitted: 0
  });
  expect(evaluations[3]).not.toHaveProperty('cardinality');
});

it('keeps substitution separate from the expression and formats relation values with union and product', () => {
  const expression = '(`Disk1.copies)';
  const { bindings, evaluations } = presentViolation({
    formula,
    cases: [
      {
        bindings: [{ variable: 'd', atom: 'Disk1' }],
        evaluations: [
          {
            expression,
            value: [['Replica0'], ['Replica1']],
            multiplicity: 'lone'
          },
          {
            expression: 'copies',
            value: [
              ['Disk0', 'Replica0'],
              ['Disk1', 'Replica1']
            ]
          },
          { expression: '#copies', value: 2 }
        ]
      }
    ]
  });
  expect(bindings).toEqual([{ variable: 'd', atom: 'Disk1' }]);
  expect(evaluations[0]).toMatchObject({
    expression,
    valueText: 'Replica0 + Replica1',
    cardinality: 'This value contains 2 atoms.'
  });
  expect(evaluations[1]).toMatchObject({
    valueText: 'Disk0 -> Replica0 + Disk1 -> Replica1',
    cardinality: 'This value contains 2 tuples.'
  });
  expect(evaluations[2]).toEqual({
    expression: '#copies',
    valueText: '2',
    omitted: 0
  });
});

it('does not invent evidence when the provider has no evaluated examples', () => {
  expect(presentViolation({ formula, cases: [] })).toEqual({
    bindings: [],
    evaluations: [],
    caseCount: 0,
    atoms: [],
    edges: []
  });
});
