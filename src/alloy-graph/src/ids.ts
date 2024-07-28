import { AlloyAtom, AlloyRelation, AlloyTuple } from '../../alloy-instance';

export function generateNodeId(atom: AlloyAtom): string {
  return atom.id;
}

export function generateEdgeId(
  relation: AlloyRelation,
  tuple: AlloyTuple
): string {
  const relationId = relation.id;
  const atoms = tuple.atoms;
  return `${relationId}:${atoms.join('->')}`;
}
