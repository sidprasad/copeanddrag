import { Graph } from '../types';

export function someEdge(
  graph: Graph,
  sourceID: string,
  targetID: string
): boolean {
  return sourceID in graph.successors && targetID in graph.successors[sourceID];
}
