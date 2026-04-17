import { hasNode } from '../hasNode';
import { Edge, Graph, Node } from '../../types';

export function _addNode<N extends Node, E extends Edge>(
  draft: Graph<N, E>,
  node: N
): void {
  const { id } = node;
  if (id && !hasNode(draft, id)) {
    draft.nodes[id] = node;
    draft.predecessors[id] = {};
    draft.successors[id] = {};
    draft.inedges[id] = [];
    draft.outedges[id] = [];
  } else {
    if (!id) throw new Error('Cannot add a node without a node ID');
    if (hasNode(draft, id))
      throw new Error(
        `Cannot add node, a node with ID ${id} already exists in the graph`
      );
  }
}
