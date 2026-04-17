import { produce, castDraft } from 'immer';
import { _addNode } from './producers/_addNode';
import { Edge, Graph, Node } from '../types';

export function addNode<N extends Node, E extends Edge>(
  graph: Graph<N, E>,
  node: N
): Graph<N, E> {
  return produce(graph, (draft) => _addNode(draft, castDraft(node)));
}
