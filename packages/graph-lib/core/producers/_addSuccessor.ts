import { Edge, Graph, Node } from '../../types';

export function _addSuccessor<N extends Node, E extends Edge>(
  draft: Graph<N, E>,
  sourceID: string,
  targetID: string,
  edgeID: string
): void {
  if (!draft.successors.hasOwnProperty(sourceID))
    draft.successors[sourceID] = {};
  if (!draft.successors[sourceID].hasOwnProperty(targetID))
    draft.successors[sourceID][targetID] = [];
  draft.successors[sourceID][targetID].push(edgeID);
}
