import { Edge, Graph, Node } from '../../types';

export function _removeOutEdge<N extends Node, E extends Edge>(
  draft: Graph<N, E>,
  sourceID: string,
  edgeID: string
): void {
  const idx = draft.outedges[sourceID].indexOf(edgeID);
  if (idx !== -1) draft.outedges[sourceID].splice(idx, 1);
}
