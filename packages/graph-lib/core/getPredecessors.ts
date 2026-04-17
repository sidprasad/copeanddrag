import { compact, keys } from 'lodash-es';
import { Edge, Graph, Node } from '../types';
import { getNode } from './getNode';

export function getPredecessors<N extends Node, E extends Edge>(
  graph: Graph<N, E>,
  nodeID: string
): N[] {
  const predecessors = graph.predecessors[nodeID];
  if (!predecessors)
    throw new Error(
      `Cannot get predecessors, the node ${nodeID} does not exist in the graph`
    );
  const predecessorIDs = keys(predecessors);
  return compact(predecessorIDs.map((nodeID) => getNode(graph, nodeID)));
}
