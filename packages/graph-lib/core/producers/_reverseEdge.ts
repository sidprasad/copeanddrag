import { assign, cloneDeep } from 'lodash-es';
import { Edge, Graph, Node } from '../../types';
import { _addEdge } from './_addEdge';
import { _removeEdge } from './_removeEdge';

export function _reverseEdge<N extends Node, E extends Edge>(
  draft: Graph<N, E>,
  edge: E
): void {
  _removeEdge(draft, edge);
  _addEdge(
    draft,
    assign(cloneDeep(edge), {
      source: edge.target,
      target: edge.source
    })
  );
}
