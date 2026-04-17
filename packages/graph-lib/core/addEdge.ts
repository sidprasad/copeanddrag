import { produce, castDraft } from 'immer';
import { _addEdge } from './producers/_addEdge';
import { Edge, Graph, Node } from '../types';

export function addEdge<N extends Node, E extends Edge>(
  graph: Graph<N, E>,
  edge: E
): Graph<N, E> {
  return produce(graph, (draft) => _addEdge(draft, castDraft(edge)));
}
