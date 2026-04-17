import { produce } from 'immer';
import { Edge, Graph, Node } from '../types';
import { getNode } from './getNode';
import { _removeNode } from './producers/_removeNode';

export function removeNodes<N extends Node, E extends Edge>(
  graph: Graph<N, E>,
  nodeIDs: string[]
): Graph<N, E> {
  return produce(graph, (draft) => {
    nodeIDs.forEach((nodeID) => {
      const node = getNode(draft, nodeID);
      if (node) _removeNode(draft, node);
    });
  });
}
