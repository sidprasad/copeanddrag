import { AlloyNode } from '@/alloy-graph';
import { Vector2 } from '@/vector2';
import dagre from 'dagre';
import { GraphComponents } from './getVisibleGraphComponents';

export function layoutGraph(components: GraphComponents): {
  nodes: AlloyNode[];
  edgePaths: Record<string, Vector2[]>;
} {
  const g = new dagre.graphlib.Graph({ multigraph: true });
  g.setGraph({ nodesep: 25, ranksep: 50, rankdir: 'TB' });

  components.nodes.forEach((node) => {
    g.setNode(node.id, { label: node.id, width: 100, height: 60 });
  });

  components.edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target, { id: edge.id });
  });

  dagre.layout(g);
  const { dx, dy } = centerOffset(g, 100, 60);

  const nodes: AlloyNode[] = [];
  const edgePaths: Record<string, Vector2[]> = {};
  components.nodes.forEach((node) => {
    nodes.push({
      ...node,
      x: g.node(node.id).x - dx,
      y: g.node(node.id).y - dy
    });
  });
  g.edges().forEach((e) => {
    const edge = g.edge(e);
    edgePaths[edge.id] = edge.points.slice(1, -1).map((point) => {
      return { x: point.x - dx, y: point.y - dy };
    });
  });

  return {
    nodes,
    edgePaths
  };
}

function centerOffset(
  graph: dagre.graphlib.Graph,
  nodeWidth: number,
  nodeHeight: number
): { dx: number; dy: number } {
  const minX = Math.min(...graph.nodes().map((n) => graph.node(n).x));
  const minY = Math.min(...graph.nodes().map((n) => graph.node(n).y));
  const maxX = Math.max(...graph.nodes().map((n) => graph.node(n).x));
  const maxY = Math.max(...graph.nodes().map((n) => graph.node(n).y));
  const dx = (maxX - minX) / 2 + nodeWidth / 2;
  const dy = (maxY - minY) / 2 + nodeHeight / 2;
  return { dx, dy };
}
