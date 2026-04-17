import { compact } from 'lodash-es';
import { Edge, Graph, Node } from '../types';
import { getEdges } from './getEdges';
import { hasNode } from './hasNode';

export function getInEdges<N extends Node, E extends Edge>(
  graph: Graph<N, E>,
  nodeID: string
): E[] {
  if (!hasNode(graph, nodeID))
    throw new Error(
      `Cannot retrieve in-edges, the node ${nodeID} does not exist in the graph`
    );
  return compact(getEdges(graph, graph.inedges[nodeID]));
}
