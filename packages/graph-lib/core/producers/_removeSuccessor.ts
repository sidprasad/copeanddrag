import { Edge, Graph, Node } from '../../types';

export function _removeSuccessor<N extends Node, E extends Edge>(
  draft: Graph<N, E>,
  sourceID: string,
  targetID: string,
  edgeID: string
): void {
  const arr = draft.successors[sourceID][targetID];
  if (arr) {
    const idx = arr.indexOf(edgeID);
    if (idx !== -1) arr.splice(idx, 1);
    if (arr.length === 0) delete draft.successors[sourceID][targetID];
  }
}
