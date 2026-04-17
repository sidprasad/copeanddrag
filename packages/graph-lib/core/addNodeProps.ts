import {produce} from 'immer';
import { Edge, Graph, Node } from '../types';
import { getNodes } from './getNodes';
import { assign, isFunction } from 'lodash-es';

export function addNodeProps<N extends Node, E extends Edge, NN extends {}>(
  graph: Graph<N, E>,
  value: NN | ((node: N) => NN)
): Graph<N & NN, E> {
  return produce(graph as Graph<N & NN, E>, (draft: Graph<N & NN, E>) => {
    const nodes = getNodes(draft);
    if (isFunction(value)) nodes.forEach((node) => assign(node, value(node)));
    else nodes.forEach((node) => assign(node, value));
  });
}
