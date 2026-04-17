import { Edge, Graph, Node } from '../types';
import { compact, keys } from 'lodash-es';
import { getNode } from './getNode';

export function getSuccessors<N extends Node, E extends Edge>(
  graph: Graph<N, E>,
  nodeID: string
): N[] {
  const successors = graph.successors[nodeID];
  if (!successors)
    throw new Error(
      `Cannot get successors, the node ${nodeID} does not exist in the graph`
    );
  const successorIDs = keys(successors);
  return compact(successorIDs.map((nodeID) => getNode(graph, nodeID)));
}
