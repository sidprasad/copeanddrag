import { Edge, Graph, Node } from '../../types';

export function _addOutEdge<N extends Node, E extends Edge>(
  draft: Graph<N, E>,
  sourceID: string,
  edgeID: string
): void {
  draft.outedges[sourceID].push(edgeID);
}
