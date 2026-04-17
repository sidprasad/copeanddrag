import { Edge, Graph, Node } from '../types';

export function getNode<N extends Node, E extends Edge>(
  graph: Graph<N, E>,
  nodeID: string
): N | undefined {
  return graph.nodes[nodeID];
}
