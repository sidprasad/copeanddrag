import { Edge, Graph, Node } from '../types';
import { getInEdges } from './getInEdges';

export function getInDegree<N extends Node, E extends Edge>(
  graph: Graph<N, E>,
  nodeID: string
): number {
  return getInEdges(graph, nodeID).length;
}
