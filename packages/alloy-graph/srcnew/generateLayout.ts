import { getEdges, getNodes, Graph } from '@/graph-lib';
import { Vector2 } from '@/vector2';
import dagre from 'dagre';
import { forEach, isUndefined, max, min } from 'lodash-es';
import { GraphLayout, GraphLayoutSettings } from './types';

/**
 * Generate node positions and edge paths for a set of graphs, ensuring that
 * common nodes and edges among the graphs share the same positions and
 * waypoints.
 */
export function generateLayout(
  graphs: Graph[],
  settings: GraphLayoutSettings
): GraphLayout {
  /**
   * Build up the complete set of nodes and edges
   */
  const nodes: Set<string> = new Set<string>();
  const edges: Record<string, { source: string; target: string }> = {};

  graphs.forEach((graph) => {
    getNodes(graph).forEach((node) => {
      nodes.add(node.id);
    });
    getEdges(graph).forEach((edge) => {
      edges[edge.id] = edge;
    });
  });

  /**
   * Add the complete set of nodes and edges to a dagre graph and perform the layout
   */
  const graph = new dagre.graphlib.Graph({ multigraph: true });
  graph.setGraph({
    nodesep: settings.nodeSep,
    ranksep: settings.rankSep,
    rankdir: 'TB'
  });

  nodes.forEach((node) => {
    graph.setNode(node, {
      label: node,
      width: settings.nodeWidth,
      height: settings.nodeHeight
    });
  });

  forEach(edges, (edge, edgeId) => {
    //console.log(`layout: ${edgeId} ${edge.source} ${edge.target}`)
    graph.setEdge(edge.source, edge.target, { id: edgeId });
  });

  dagre.layout(graph);

  /**
   * Calculate centering offset, apply to all points, and build the graph
   * layout object.
   */
  const centeringOffset = calculateCenteringOffset(graph, settings);
  const nodePositions: Record<string, Vector2> = {};
  const edgeWaypoints: Record<string, Vector2[]> = {};

  graph.nodes().forEach((node) => {
    const { x, y } = graph.node(node);
    nodePositions[node] = {
      x: x - centeringOffset.x,
      y: y - centeringOffset.y
    };
  });

  graph.edges().forEach((edge) => {
    const { id, points } = graph.edge(edge);
    edgeWaypoints[id] = points.slice(1, -1).map((point) => ({
      x: point.x - centeringOffset.x,
      y: point.y - centeringOffset.y
    }));
  });

  return {
    nodePositions,
    edgeWaypoints
  };
}

function calculateCenteringOffset(
  graph: dagre.graphlib.Graph,
  settings: GraphLayoutSettings
): Vector2 {
  const xs = graph.nodes().map((n) => graph.node(n).x);
  const ys = graph.nodes().map((n) => graph.node(n).y);
  const minx = min(xs);
  const miny = min(ys);
  const maxx = max(xs);
  const maxy = max(ys);
  const x =
    isUndefined(minx) || isUndefined(maxx)
      ? 0
      : (maxx - minx) / 2 + settings.nodeWidth / 2;
  const y =
    isUndefined(miny) || isUndefined(maxy)
      ? 0
      : (maxy - miny) / 2 + settings.nodeHeight / 2;
  return { x, y };
}
