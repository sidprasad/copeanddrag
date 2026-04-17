import { Edge, Graph, Node } from '../../types';
import { getInEdges } from '../getInEdges';
import { getOutEdges } from '../getOutEdges';
import { _removeEdge } from './_removeEdge';

export function _removeNode<N extends Node, E extends Edge>(
  draft: Graph<N, E>,
  node: N
): void {
  const { id } = node;
  const inEdges = getInEdges(draft, id);
  const outEdges = getOutEdges(draft, id);
  inEdges.forEach((edge) => _removeEdge(draft, edge));
  outEdges.forEach((edge) => _removeEdge(draft, edge));
  delete draft.nodes[id];
  delete draft.predecessors[id];
  delete draft.successors[id];
  delete draft.inedges[id];
  delete draft.outedges[id];
}
