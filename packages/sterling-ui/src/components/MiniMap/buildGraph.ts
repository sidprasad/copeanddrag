import {
  newGraph,
  PositionedGraph,
  PositionedNode,
  RoutedEdge
} from '@/graph-lib';

// The space inbetween node centers
const NODE_SPACING = 50;

export function buildGraph(
  numStates: number,
  loopBack: number
): PositionedGraph {
  const nodes: PositionedNode[] = [];
  const edges: RoutedEdge[] = [];

  const width = NODE_SPACING * (numStates - 1);
  const sx = -width / 2;

  for (let i = 0; i < numStates; ++i) {
    nodes.push({
      id: `${i}`,
      x: sx + i * NODE_SPACING,
      y: 5
    });
    if (i < numStates - 1) {
      edges.push({
        id: `${i}->${i + 1}`,
        source: `${i}`,
        target: `${i + 1}`
      });
    } else {
      const id = `${i}->${loopBack}`;
      const tx = sx + loopBack * NODE_SPACING;
      edges.push({
        id: id,
        source: `${i}`,
        target: `${loopBack}`,
        waypoints: [
          { x: sx + i * NODE_SPACING - 15, y: -15 },
          { x: tx + 15, y: -15 }
        ]
      });
    }
  }

  return newGraph(nodes, edges);
}
