import { Graph } from '../types';

export function hasNode(graph: Graph, nodeID: string): boolean {
  return nodeID in graph.nodes;
}
