import { getNode } from '../core/getNode';
import { getSuccessors } from '../core/getSuccessors';
import { Edge, Graph, Node } from '../types';

/**
 * Return an array of nodes ordered in a breadth-first traversal of the graph, beginning at the specified node, or
 * invoke the specified function for each node in a breadth-first travseral of the graph, beginning at the specified
 * node. If a callback function is provided, no array is returned.
 * @param graph The graph to traverse
 * @param nodeID The ID of the node whose descendants will be traversed
 * @param callback A callback function that will be invoked with the current descendant, the zero-based traversal index,
 *                 and the node object with id nodeID
 */
export function breadthFirst<N extends Node, E extends Edge>(
  graph: Graph<N, E>,
  nodeID: string
): N[];
export function breadthFirst<N extends Node, E extends Edge>(
  graph: Graph<N, E>,
  nodeID: string,
  callback: (current: N, index: number, node: N) => boolean | void
): void;
export function breadthFirst<N extends Node, E extends Edge>(
  graph: Graph<N, E>,
  nodeID: string,
  callback?: (current: N, index: number, node: N) => boolean | void
): N[] | void {
  const node = getNode(graph, nodeID);
  if (!node)
    throw new Error(
      `Cannot generate breadth first order, the node ${nodeID} does not exist in the graph`
    );

  let curr: N | undefined;
  let queue: N[] = [node];
  const visited: { [id: string]: boolean } = {};

  if (!callback) {
    // No callback is specified, so build an array in BFO
    const out: N[] = [];
    while ((curr = queue.shift())) {
      if (!visited[curr.id]) {
        visited[curr.id] = true;
        out.push(curr);
        queue.push(...getSuccessors(graph, curr.id));
      }
    }
    return out;
  } else {
    // Callback specifiedd, so traverse in BFO until callback returns truthy
    let index = -1;
    while ((curr = queue.shift())) {
      if (!visited[curr.id]) {
        visited[curr.id] = true;
        if (callback(curr, ++index, node)) break;
        queue.push(...getSuccessors(graph, curr.id));
      }
    }
  }
}
