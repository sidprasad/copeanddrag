import { Edge, Graph, Node } from '../../types';

export function _newGraph<N extends Node, E extends Edge>(): Graph<N, E> {
  return {
    nodes: {},
    edges: {},
    predecessors: {},
    successors: {},
    inedges: {},
    outedges: {}
  };
}
