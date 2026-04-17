import { produce, castDraft } from 'immer';
import { _addEdge } from './producers/_addEdge';
import { Edge, Graph, Node } from '../types';

export function addEdges<N extends Node, E extends Edge>(
  graph: Graph<N, E>,
  edges: E[]
): Graph<N, E> {
  return produce(graph, (draft) => {
    edges.forEach((edge) => _addEdge(draft, castDraft(edge)));
  });
}
