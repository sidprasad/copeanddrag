import { addEdges } from './addEdges';
import { addNodes } from './addNodes';
import { _newGraph } from './producers/_newGraph';
import { Edge, Graph, Node } from '../types';

export function newGraph<N extends Node, E extends Edge>(
  nodes?: N[],
  edges?: E[]
): Graph<N, E> {
  nodes = nodes || [];
  edges = edges || [];
  return addEdges(addNodes(_newGraph(), nodes), edges);
}
