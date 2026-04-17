import { getEdge } from './getEdge';
import { Edge, Graph, Node } from '../types';
import { values } from 'lodash-es';

export function getEdges<N extends Node, E extends Edge>(
  graph: Graph<N, E>
): E[];
export function getEdges<N extends Node, E extends Edge>(
  graph: Graph<N, E>,
  edgeIDs: string[]
): (E | undefined)[];
export function getEdges<N extends Node, E extends Edge>(
  graph: Graph<N, E>,
  edgeIDs?: string[]
): (E | undefined)[] {
  return edgeIDs
    ? edgeIDs.map((edgeID) => getEdge(graph, edgeID))
    : values(graph.edges);
}
