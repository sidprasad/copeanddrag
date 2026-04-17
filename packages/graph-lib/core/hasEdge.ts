import { Graph } from '../types';

export function hasEdge(graph: Graph, edgeID: string): boolean {
  return edgeID in graph.edges;
}
