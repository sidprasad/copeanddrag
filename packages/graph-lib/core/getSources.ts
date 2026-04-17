import { Edge, Graph, Node } from '../types';
import { getInDegree } from './getInDegree';
import { getNodes } from './getNodes';

export function getSources<N extends Node, E extends Edge>(
  graph: Graph<N, E>
): N[] {
  return getNodes(graph).filter((node) => getInDegree(graph, node.id) === 0);
}
