import { compact } from 'lodash-es';
import { Edge, Graph, Node } from '../types';
import { getEdges } from './getEdges';
import { hasNode } from './hasNode';

export function getOutEdges<N extends Node, E extends Edge>(
  graph: Graph<N, E>,
  nodeID: string
): E[] {
  if (!hasNode(graph, nodeID))
    throw new Error(
      `Cannot retrieve out-edges, the node ${nodeID} does not exist in the graph`
    );
  return compact(getEdges(graph, graph.outedges[nodeID]));
}
