import { Edge, Graph, Node } from '../../types';

export function _addInEdge<N extends Node, E extends Edge>(
  draft: Graph<N, E>,
  targetID: string,
  edgeID: string
): void {
  draft.inedges[targetID].push(edgeID);
}
