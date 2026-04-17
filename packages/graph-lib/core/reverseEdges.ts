import { produce } from 'immer';
import { Edge, Graph, Node } from '../types';
import { getEdge } from './getEdge';
import { _reverseEdge } from './producers/_reverseEdge';

export function reverseEdges<N extends Node, E extends Edge>(
  graph: Graph<N, E>,
  edgeIDs: string[]
): Graph<N, E> {
  return produce(graph, (draft) => {
    edgeIDs.forEach((edgeID) => {
      const edge = getEdge(draft, edgeID);
      if (edge) _reverseEdge(draft, edge);
    });
  });
}
