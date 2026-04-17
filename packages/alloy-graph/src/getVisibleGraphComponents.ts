import { AlloyEdge } from '@/alloy-graph';
import {
  AlloyAtom,
  AlloyInstance,
  atomIsOfType,
  getAtomType,
  getInstanceAtom,
  getInstanceAtoms,
  getInstanceRelations,
  getRelationTuples,
  isBuiltin
} from '@/alloy-instance';
import { getHiddenTypes, SterlingThemeOld } from '@/sterling-theme';
import { Node } from '@/graph-lib';

export type AtomNode = Node & { atom: AlloyAtom };
export type GraphComponents = {
  nodes: AtomNode[];
  edges: AlloyEdge[];
};

export function getVisibleGraphComponents(
  instance: AlloyInstance,
  theme?: SterlingThemeOld
): GraphComponents {
  const visibleAtoms = new Set<string>();
  const visibleEdges: AlloyEdge[] = [];
  const hiddenTypes = theme ? getHiddenTypes(theme) : [];

  getInstanceRelations(instance).forEach((relation) => {
    const id = relation.id;
    const tuples = getRelationTuples(relation);
    tuples.forEach((tuple) => {
      const atoms = tuple.atoms;
      const first = atoms[0];
      const last = atoms[atoms.length - 1];
      const firstVisible = !hiddenTypes.some((hiddenType) =>
        atomIsOfType(instance, first, hiddenType)
      );
      const lastVisible = !hiddenTypes.some((hiddenType) =>
        atomIsOfType(instance, last, hiddenType)
      );
      if (firstVisible && lastVisible) {
        visibleAtoms.add(first);
        visibleAtoms.add(last);
        visibleEdges.push({
          id: `${id}:${atoms.join('->')}`,
          relation: relation.name,
          source: first,
          target: last,
          tuple
        });
      }
    });
  });

  getInstanceAtoms(instance).forEach((atom) => {
    const type = getAtomType(instance, atom);
    if (
      !isBuiltin(type) &&
      !hiddenTypes.some((hiddenType) =>
        atomIsOfType(instance, atom, hiddenType)
      )
    ) {
      visibleAtoms.add(atom.id);
    }
  });

  const visibleNodes: AtomNode[] = [];
  visibleAtoms.forEach((atomId) => {
    visibleNodes.push({
      id: atomId,
      atom: getInstanceAtom(instance, atomId)
    });
  });

  return {
    nodes: visibleNodes,
    edges: visibleEdges
  };
}
