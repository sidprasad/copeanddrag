import { Edge, Graph, Node } from '../../types';

export function _addPredecessor<N extends Node, E extends Edge>(
  draft: Graph<N, E>,
  sourceID: string,
  targetID: string,
  edgeID: string
): void {
  if (!draft.predecessors.hasOwnProperty(targetID))
    draft.predecessors[targetID] = {};
  if (!draft.predecessors[targetID].hasOwnProperty(sourceID))
    draft.predecessors[targetID][sourceID] = [];
  draft.predecessors[targetID][sourceID].push(edgeID);
}
