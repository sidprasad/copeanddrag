import { AlloyEdge, AlloyNode } from '@/alloy-graph';
import { Dict, PathDef } from '@graph-ts/graph-svg';
import dagre from 'dagre';
import { GraphComponents } from './getVisibleGraphComponents';

export function layoutNodes<N extends AlloyNode>(components: GraphComponents): N[] {
  const g = new dagre.graphlib.Graph({ multigraph: true });
  g.setGraph({ nodesep: 50, ranksep: 100, rankdir: 'TB' });

  components.nodes.forEach((node) => {
    g.setNode(node.id, { label: node.id, width: 120, height: 65 });
  });

  components.edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target, { id: edge.id });
  });

  dagre.layout(g);
  const { dx, dy } = centerOffset(g, 120, 65);

  const nodes: N[] = [];
  components.nodes.forEach((node) => {
    nodes.push({
      ...node,
      x: g.node(node.id).x - dx,
      y: g.node(node.id).y - dy
    });
  });

  return nodes;
}``

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
