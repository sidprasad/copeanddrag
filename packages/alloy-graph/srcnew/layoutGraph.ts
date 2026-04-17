import {
  AlloyEdge,
  AlloyGraph,
  AlloyGraphPositioned,
  AlloyNode,
  GraphLayout
} from '@/alloy-graph';
import {
  getEdges,
  getNodes,
  newGraph,
  PositionedNode,
  RoutedEdge
} from '@/graph-lib';

/**
 * Apply a layout to a graph to generate a positioned graph.
 * @param graph The graph to layout.
 * @param layout The layout to apply to the graph.
 */
export function layoutGraph(
  graph: AlloyGraph,
  layout: GraphLayout
): AlloyGraphPositioned {
  const nodes: (PositionedNode & AlloyNode)[] = getNodes(graph).map((node) => {
    const position = layout.nodePositions[node.id];
    return {
      ...node,
      x: position?.x || 0,
      y: position?.y || 0
    };
  });
  const edges: (RoutedEdge & AlloyEdge)[] = getEdges(graph).map((edge) => {
    return {
      ...edge,
      waypoints: layout.edgeWaypoints[edge.id] || []
    };
  });
  return newGraph(nodes, edges);
}
