import { hasEdge } from '../hasEdge';
import { hasNode } from '../hasNode';
import { hasNodes } from '../hasNodes';
import { Edge, Graph, Node } from '../../types';
import { _addInEdge } from './_addInEdge';
import { _addOutEdge } from './_addOutEdge';
import { _addPredecessor } from './_addPredecessor';
import { _addSuccessor } from './_addSuccessor';

export function _addEdge<N extends Node, E extends Edge>(
  draft: Graph<N, E>,
  edge: E
): void {
  const { id, source, target } = edge;
  if (id && hasNodes(draft, [source, target]) && !hasEdge(draft, id)) {
    draft.edges[id] = edge;
    _addPredecessor(draft, source, target, id);
    _addSuccessor(draft, source, target, id);
    _addInEdge(draft, target, id);
    _addOutEdge(draft, source, id);
  } else {
    if (!id) throw new Error('Cannot add an edge without an edge ID');
    if (!hasNode(draft, source))
      throw new Error(
        `Cannot add edge ${id}, the source node ${source} is not in the graph`
      );
    if (!hasNode(draft, target))
      throw new Error(
        `Cannot add edge ${id}, the target node ${target} is not in the graph`
      );
    if (hasEdge(draft, id))
      throw new Error(
        `Cannot add edge, an edge with ID ${id} already exists in the graph`
      );
  }
}
