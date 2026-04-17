import {produce} from 'immer';
import { Edge, Graph, Node } from '../types';
import { getEdges } from './getEdges';
import { assign, isFunction } from 'lodash-es';

export function addEdgeProps<N extends Node, E extends Edge, EE extends {}>(
  graph: Graph<N, E>,
  value: EE | ((edge: E) => EE)
): Graph<N, E & EE> {
  return produce(graph as Graph<N, E & EE>, (draft: Graph<N, E & EE>) => {
    const edges = getEdges(draft);
    if (isFunction(value)) edges.forEach((edge) => assign(edge, value(edge)));
    else edges.forEach((edge) => assign(edge, value));
  });
}
