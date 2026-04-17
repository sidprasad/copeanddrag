import {produce, castDraft } from 'immer';
import { _addNode } from './producers/_addNode';
import { Edge, Graph, Node } from '../types';

export function addNodes<N extends Node, E extends Edge>(
  graph: Graph<N, E>,
  nodes: N[]
): Graph<N, E> {
  return produce(graph, (draft) => {
    nodes.forEach((node) => _addNode(draft, castDraft(node)));
  });
}
