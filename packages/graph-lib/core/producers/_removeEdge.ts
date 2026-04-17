import { Edge, Graph, Node } from '../../types';
import { _removeInEdge } from './_removeInEdge';
import { _removeOutEdge } from './_removeOutEdge';
import { _removePredecessor } from './_removePredecessor';
import { _removeSuccessor } from './_removeSuccessor';

export function _removeEdge<N extends Node, E extends Edge>(
  draft: Graph<N, E>,
  edge: E
): void {
  const { id, source, target } = edge;
  delete draft.edges[id];
  _removePredecessor(draft, source, target, id);
  _removeSuccessor(draft, source, target, id);
  _removeInEdge(draft, target, id);
  _removeOutEdge(draft, source, id);
}
