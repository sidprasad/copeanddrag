import { Edge, Graph, Node } from '../types';

export function getEdge<N extends Node, E extends Edge>(
  graph: Graph<N, E>,
  edgeID: string
): E | undefined {
  return graph.edges[edgeID];
}
