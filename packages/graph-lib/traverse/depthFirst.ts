import { getNode } from '../core/getNode';
import { getSuccessors } from '../core/getSuccessors';
import { Edge, Graph, Node } from '../types';

export function depthFirst<N extends Node, E extends Edge>(
  graph: Graph<N, E>,
  nodeID: string
): N[];
export function depthFirst<N extends Node, E extends Edge>(
  graph: Graph<N, E>,
  nodeID: string,
  callback: (current: N, index: number, node: N) => boolean | void
): void;
export function depthFirst<N extends Node, E extends Edge>(
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
  const visited: { [id: string]: boolean } = {};

  if (!callback) {
    // No callback is specified, so build an array in DFO
    const out: N[] = [];
    while ((curr = stack.pop())) {
      if (!visited[curr.id]) {
        visited[curr.id] = true;
        out.push(curr);
        stack.push(...getSuccessors(graph, curr.id));
      }
    }
    return out;
  } else {
    // Callback specified, so traverse in DFO until callback returns truthy
    let index = -1;
    while ((curr = stack.pop())) {
      if (!visited[curr.id]) {
        visited[curr.id] = true;
        if (callback(curr, ++index, node)) break;
        stack.push(...getSuccessors(graph, curr.id));
      }
    }
  }
}
