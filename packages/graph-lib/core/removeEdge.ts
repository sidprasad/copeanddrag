import {produce, castDraft } from 'immer';
import { Edge, Graph, Node } from '../types';
import { getEdge } from './getEdge';
import { _removeEdge } from './producers/_removeEdge';

export function removeEdge<N extends Node, E extends Edge>(
  graph: Graph<N, E>,
  edgeID: string
): Graph<N, E> {
  return produce(graph, (draft) => {
    const edge = getEdge(graph, edgeID);
    if (edge) _removeEdge(draft, castDraft(edge));
  });
}
