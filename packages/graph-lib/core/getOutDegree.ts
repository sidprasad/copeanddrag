import { Edge, Graph, Node } from '../types';
import { getOutEdges } from './getOutEdges';

export function getOutDegree<N extends Node, E extends Edge>(
  graph: Graph<N, E>,
  nodeID: string
): number {
  return getOutEdges(graph, nodeID).length;
}
