import { getNode } from '../core/getNode';
import { getSuccessors } from '../core/getSuccessors';
import { Edge, Graph, Node } from '../types';

export function depthFirstPost<N extends Node, E extends Edge>(
  graph: Graph<N, E>,
  nodeID: string
): N[];
export function depthFirstPost<N extends Node, E extends Edge>(
  graph: Graph<N, E>,
  nodeID: string,
  callback: (current: N, index: number, node: N) => boolean | void
): void;
export function depthFirstPost<N extends Node, E extends Edge>(
  graph: Graph<N, E>,
  nodeID: string,
  callback?: (current: N, index: number, node: N) => boolean | void
): N[] | void {
  const node = getNode(graph, nodeID);
  if (!node)
    throw new Error(
      `Cannot generate depth first order, the node ${nodeID} does not exist in the graph`
    );

  let curr: N | undefined;
  let stack: N[] = [node];
  const out: N[] = [];
  const visited: { [id: string]: boolean } = {};

  while ((curr = stack.pop())) {
    if (!visited[curr.id]) {
      visited[curr.id] = true;
      out.push(curr);
      stack.push(...getSuccessors(graph, curr.id));
    }
  }

  if (!callback) return out.reverse();

  let index = -1;
  while ((curr = out.pop())) {
    if (callback(curr, ++index, node)) break;
  }
}
