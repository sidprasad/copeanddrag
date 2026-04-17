import {
  AlloyInstance,
  AlloyRelation,
  AlloyAtom,
  atomIsBuiltin,
  getInstanceAtom,
  getInstanceAtoms,
  getInstanceRelations,
  getRelationTuples
} from '@/alloy-instance';
import { newGraph } from '@/graph-lib';
import { getRelationIsAttribute, getRelationSTIndexes, SterlingTheme } from '@/sterling-theme';
import { WritableDraft } from 'immer/dist/types/types-external';
import { first, last } from 'lodash-es';
import { generateEdgeId, generateNodeId } from './ids';
import { AlloyEdge, AlloyGraph, AlloyNode } from './types';

/**
 * Generate a directed graph from an Alloy instance. The nodes and edges of the
 * graph are not positioned.
 *
 * @param instance An instance to use to generate a graph.
 * @param theme A theme to use to determine whether disconnected nodes should be visible.
 */
export function generateGraph(
  instance: AlloyInstance,
  theme?: SterlingTheme | WritableDraft<SterlingTheme>
): AlloyGraph {
  // Determine which nodes to exclude from the graph
  const hideDisconnected = theme?.hidden?.disconnected || false;
  const hideDisconnectedBuiltins =
    hideDisconnected || theme?.hidden?.builtinDisconnected || false;

  // Get the set of node ids and edges ids that are to be included in the graph
  const { nodeIds, edgeIds } = getVisibleGraphComponents(
    instance,
    hideDisconnected,
    hideDisconnectedBuiltins,
    theme
  );

  const nodes: AlloyNode[] = [];
  getInstanceAtoms(instance).forEach((atom) => {
    const nodeId = generateNodeId(atom);
    if (nodeIds.has(nodeId))
      nodes.push({
        id: nodeId,
        atom
      });
  });

  const edges: AlloyEdge[] = [];
  getInstanceRelations(instance).forEach((relation) => {
    const isAttribute = theme
      ? getRelationIsAttribute(theme, relation.id)
      : false;
    if (!isAttribute) {
      getRelationTuples(relation).forEach((tuple) => {
        const edgeId = generateEdgeId(relation, tuple);
        const atoms = tuple.atoms;
        
        // If the relation has arity 3 or higher, use theming settings to
        // determine how to lay out the arc. This is useful for, e.g., models 
        // that define a weighted directed graph on 3-ary edges: Node->Node->Int
        const [sourceIndex,targetIndex] = getRelationSTIndexes(theme, relation.id, atoms.length)
        
        const source = sourceIndex ? atoms[sourceIndex] : first(atoms);
        const target = targetIndex ? atoms[targetIndex] : last(atoms);

        if (source && target && edgeIds.has(edgeId))
          edges.push({
            id: edgeId,
            source: generateNodeId(getInstanceAtom(instance, source)),
            target: generateNodeId(getInstanceAtom(instance, target)),
            relation,
            tuple
          });
      });
    }
  });

  return newGraph(nodes, edges);
}

/**
 * Get the set of visible node ids and visible edges ids. Nodes and edges that
 * are connected are considered visible. Disconnected nodes can all be hidden by
 * passing in true for hideDisconnected, or just disconnected nodes that are
 * from builtin signatures can be hidden by passing in false for
 * hideDisconnected and true for hideDisconnectedBuiltins.
 *
 * @param instance
 * @param hideDisconnected
 * @param hideDisconnectedBuiltins
 */
function getVisibleGraphComponents(
  instance: AlloyInstance,
  hideDisconnected: boolean,
  hideDisconnectedBuiltins: boolean,
  theme?: SterlingTheme | WritableDraft<SterlingTheme>
): { nodeIds: Set<string>; edgeIds: Set<string> } {
  const nodeIds: Set<string> = new Set<string>();
  const edgeIds: Set<string> = new Set<string>();

  // Add all connected nodes and edges to the set of visible nodes and edges
  getInstanceRelations(instance).forEach((relation) => {
    getRelationTuples(relation).forEach((tuple) => {
      const atoms = tuple.atoms.map((atomId) =>
        getInstanceAtom(instance, atomId)
      );

      // NOTE: code duplication with caller
      const [source, target] = resolveSourceAndTarget(relation, atoms, theme)

      if (source && target) {
        nodeIds.add(generateNodeId(source));
        nodeIds.add(generateNodeId(target));
        edgeIds.add(generateEdgeId(relation, tuple));
      }
    });
  });

  // Find all disconnected nodes and determine whether to include them
  getInstanceAtoms(instance).forEach((atom) => {
    const nodeId = generateNodeId(atom);
    if (!nodeIds.has(nodeId)) {
      if (!hideDisconnected) {
        const isBuiltin = atomIsBuiltin(instance, atom);
        if (!isBuiltin || !hideDisconnectedBuiltins) {
          nodeIds.add(nodeId);
        }
      }
    }
  });

  return {
    nodeIds,
    edgeIds
  };
}

function resolveSourceAndTarget(
    relation: AlloyRelation, atoms: AlloyAtom[],
    theme?: SterlingTheme| WritableDraft<SterlingTheme>): [AlloyAtom|undefined, AlloyAtom|undefined] {
  if(theme) {
    const [sourceIndex,targetIndex] = getRelationSTIndexes(theme, relation.id, atoms.length)
    const source = sourceIndex ? atoms[sourceIndex] : first(atoms);
    const target = targetIndex ? atoms[targetIndex] : last(atoms);
    return [source,target]
  } else {
    const source = first(atoms);
    const target = last(atoms);  
    return [source,target]
  }

}
