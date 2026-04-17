import { Edge, Graph, Node } from '../../types';

export function _removeInEdge<N extends Node, E extends Edge>(
  draft: Graph<N, E>,
  targetID: string,
  edgeID: string
): void {
  const idx = draft.inedges[targetID].indexOf(edgeID);
  if (idx !== -1) draft.inedges[targetID].splice(idx, 1);
}
