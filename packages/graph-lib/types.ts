import { Vector2 } from '@/vector2';

/**
 * A graph node
 */
export type Node = {
  // A unique node identifier
  readonly id: string;
};

/**
 * A graph edge
 */
export type Edge = {
  // A unique edge identifier
  readonly id: string;

  // The source node ID
  readonly source: string;

  // The target node ID
  readonly target: string;
};

/**
 * A directed graph composed of nodes and edges
 */
export type Graph<N extends Node = Node, E extends Edge = Edge> = {
  // Map node IDs to nodes
  readonly nodes: { [id: string]: N };

  // Map edge IDs to edges
  readonly edges: { [id: string]: E };

  // Map target node IDs to source node IDs to array of edge IDs
  readonly predecessors: {
    [target: string]: {
      [source: string]: string[];
    };
  };

  // Map source node IDs to target node IDs to array of edge IDs
  readonly successors: {
    [source: string]: {
      [target: string]: string[];
    };
  };

  // Map node IDs to array of edge IDs
  readonly inedges: {
    [id: string]: string[];
  };

  // Map node IDs to array of edge IDs
  readonly outedges: {
    [id: string]: string[];
  };
};

/**
 * A graph node with x- and y- coordinates
 */
export type PositionedNode = Node & Vector2;

/**
 * An edge with specified waypoints
 */
export type RoutedEdge = Edge & { waypoints?: Vector2[] };

/**
 * A graph with positioned nodes and routed edges
 */
export type PositionedGraph = Graph<PositionedNode, RoutedEdge>;
