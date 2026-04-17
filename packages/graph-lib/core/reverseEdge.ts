import { produce, castDraft } from 'immer';
import { Edge, Graph, Node } from '../types';
import { getEdge } from './getEdge';
import { _reverseEdge } from './producers/_reverseEdge';

export function reverseEdge<N extends Node, E extends Edge>(
  graph: Graph<N, E>,
  edgeID: string
): Graph<N, E> {
  return produce(graph, (draft) => {
    const edge = getEdge(graph, edgeID);
    if (edge) _reverseEdge(draft, castDraft(edge));
  });
}
