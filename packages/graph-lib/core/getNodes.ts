import { values } from 'lodash-es';
import { getNode } from './getNode';
import { Edge, Graph, Node } from '../types';

export function getNodes<N extends Node, E extends Edge>(
  graph: Graph<N, E>
): N[];
export function getNodes<N extends Node, E extends Edge>(
  graph: Graph<N, E>,
  nodeIDs: string[]
): (N | undefined)[];
export function getNodes<N extends Node, E extends Edge>(
  graph: Graph<N, E>,
  nodeIDs?: string[]
): (N | undefined)[] {
  return nodeIDs
    ? nodeIDs.map((nodeID) => getNode(graph, nodeID))
    : values(graph.nodes);
}
