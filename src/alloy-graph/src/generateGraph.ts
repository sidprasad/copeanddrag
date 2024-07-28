import {
  AlloyInstance,
  AlloyRelation,
  AlloyAtom,
  atomIsBuiltin,
  getInstanceAtom,
  getInstanceAtoms,
  getInstanceRelations,
  getRelationTuples
} from '../../alloy-instance';
// import { newGraph } from 'graph-lib';

//import { newGraph } from 'graph-lib';

//import { getRelationIsAttribute, getRelationSTIndexes, SterlingTheme } from '../../sterling-theme';
// import { WritableDraft } from 'immer/dist/types/types-external';
import { first, last } from 'lodash';
import { generateEdgeId, generateNodeId } from './ids';
//import { AlloyEdge, AlloyGraph, AlloyNode } from './types';
import { Graph, Edge } from 'graphlib';




///*** Copied in from Sterling. Can improve this  **/

export function getRelationSTIndexes(
  relation: string, 
  arity: number
): [number,number] {
  if(arity < 2) return [0, 0]
  return [0,arity-1]
  // const edges = theme.edges;
  // if(!edges) return [0,arity-1];
  
  // const firstMatch = edges.find(
  //     (spec) =>
  //       // Any index override to account for
  //       (spec.sourceIndex || spec.targetIndex) &&
  //       spec.targets?.some(
  //         (target) => target === '*' || target.relation === relation
  //       )
  //   )
  // if(!firstMatch) return [0, arity-1];
  // const sourceIndex = firstMatch.sourceIndex ? firstMatch.sourceIndex : 0
  // const targetIndex = firstMatch.targetIndex ? firstMatch.targetIndex : arity-1
  // return [sourceIndex, targetIndex]
}


function getRelationIsAttribute() {

  // Read this from the layout spec

  return false;
}

///



/**
 * Generate a directed graph from an Alloy instance. The nodes and edges of the
 * graph are not positioned.
 *
 * @param instance An instance to use to generate a graph.
 * @param theme A theme to use to determine whether disconnected nodes should be visible.
 */
export function generateGraph(
  instance: AlloyInstance,
  //theme?: SterlingTheme //| WritableDraft<SterlingTheme>
): Graph {


  const graph = new Graph({ directed: true, multigraph: true });

  // Determine which nodes to exclude from the graph
  const hideDisconnected = false //theme?.hidden?.disconnected || false;
  const hideDisconnectedBuiltins =  true //false //  hideDisconnected || theme?.hidden?.builtinDisconnected || false;

  // Get the set of node ids and edges ids that are to be included in the graph
  const { nodeIds, edgeIds } = getVisibleGraphComponents(
    instance,
    hideDisconnected,
    hideDisconnectedBuiltins,
    //theme
  );


  getInstanceAtoms(instance).forEach((atom) => {
    const nodeId = generateNodeId(atom);
    if (nodeIds.has(nodeId))
      // Add node to graph
      graph.setNode(nodeId, nodeId);
  });

  getInstanceRelations(instance).forEach((relation) => {
    const isAttribute = false
    
    // theme
    //   ? getRelationIsAttribute(theme, relation.id)
    //   : false;
    if (!isAttribute) {
      getRelationTuples(relation).forEach((tuple) => {
        const edgeId = generateEdgeId(relation, tuple);
        const atoms = tuple.atoms;

        // If the relation has arity 3 or higher, use theming settings to
        // determine how to lay out the arc. This is useful for, e.g., models 
        // that define a weighted directed graph on 3-ary edges: Node->Node->Int
        const [sourceIndex, targetIndex] = getRelationSTIndexes(relation.id, atoms.length)

        const source = sourceIndex ? atoms[sourceIndex] : first(atoms);
        const target = targetIndex ? atoms[targetIndex] : last(atoms);


        // TODO: This is tricky, what should we do here?

        if (source && target && edgeIds.has(edgeId)) {
          let label: string = relation.name;
          let source_node_id = generateNodeId(getInstanceAtom(instance, source));
          let target_node_id = generateNodeId(getInstanceAtom(instance, target));

          graph.setEdge(source_node_id, target_node_id, label, edgeId);
        }


      });
    }
  });

  return graph;
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
  //theme?: SterlingTheme //| WritableDraft<SterlingTheme>
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
      const [source, target] = resolveSourceAndTarget(relation, atoms) //, theme)

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
  //theme?: SterlingTheme //| WritableDraft<SterlingTheme>
): [AlloyAtom | undefined, AlloyAtom | undefined] {
  // if (theme) {
  //   const [sourceIndex, targetIndex] = getRelationSTIndexes(theme, relation.id, atoms.length)
  //   const source = sourceIndex ? atoms[sourceIndex] : first(atoms);
  //   const target = targetIndex ? atoms[targetIndex] : last(atoms);
  //   return [source, target]
  // } else {
    const source = first(atoms);
    const target = last(atoms);
    return [source, target]
  //}
}
