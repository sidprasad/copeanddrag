import { produce, castDraft } from 'immer';
import { Edge, Graph, Node } from '../types';
import { getNode } from './getNode';
import { _removeNode } from './producers/_removeNode';

export function removeNode<N extends Node, E extends Edge>(
  graph: Graph<N, E>,
  nodeID: string
): Graph<N, E> {
  const node = getNode(graph, nodeID);
  return node
    ? produce(graph, (draft) => _removeNode(draft, castDraft(node)))
    : graph;
}
