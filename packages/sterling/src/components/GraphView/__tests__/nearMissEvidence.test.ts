import { sourceLocation, presentViolation } from '../nearMissEvidence';

const formula = { text: 'all d: Disk | lone d.copies', predicate: 'separated', file: '/models/storage.frg', line: 5 };

it('identifies the source rule and handles formulas without a source location', () => {
  expect(sourceLocation(formula)).toBe('storage.frg:5');
  expect(sourceLocation({ text: 'no Disk', predicate: false, file: false, line: false })).toBeUndefined();
});

it('uses the same sample for the explanation and the directed field highlights', () => {
  const replicas = Array.from({ length: 9 }, (_, i) => [`Replica${i}`]);
  const { lines, atoms, edges } = presentViolation({ formula, cases: [{
    bindings: [{ variable: 'd', atom: 'Disk0' }],
    evaluations: [{ expression: 'Disk0.copies', value: replicas, multiplicity: 'lone',
      relation: 'copies', tuples: replicas.map(row => ['Disk0', ...row]) }]
  }, { bindings: [{ variable: 'd', atom: 'Disk1' }], evaluations: [] }] });
  expect(lines).toEqual([
    'd = Disk0 (1 of 2 bindings)',
    'Disk0.copies = {Replica0, Replica1, Replica2, Replica3, Replica4, Replica5, Replica6, Replica7} (+1 more)'
  ]);
  expect(edges).toEqual(replicas.slice(0, 8).map(([target]) => ({ relation: 'copies', source: 'Disk0', target })));
  expect(atoms).toEqual(['Disk0', ...replicas.slice(0, 8).flat()]);
});

it('keeps derived pairs, ternary field tuples, and empty fields out of the binary edge highlights', () => {
  const { lines, edges, atoms } = presentViolation({ formula, cases: [{
    bindings: [{ variable: 'r', atom: 0 }],
    evaluations: [
      { expression: '^next', value: [['A', 'B']] },
      { expression: 'entries', value: [['A', 0, 'C']], relation: 'entries', tuples: [['A', 0, 'C']] },
      { expression: 'copies.r', multiplicity: 'some', value: [], relation: 'copies', tuples: [] },
      { expression: 'some copies', value: false }
    ]
  }] });
  expect(edges).toEqual([]);
  expect(atoms).toEqual(['0', 'A', 'B', 'C']);
  expect(lines).toContain('copies.r = {}');
  expect(lines).toContain('some copies = false');
});
