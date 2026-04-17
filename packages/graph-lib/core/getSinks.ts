import { Edge, Graph, Node } from '../types';
import { getNodes } from './getNodes';
import { getOutDegree } from './getOutDegree';

export function getSinks<N extends Node, E extends Edge>(
  graph: Graph<N, E>
): N[] {
  return getNodes(graph).filter((node) => getOutDegree(graph, node.id) === 0);
}
