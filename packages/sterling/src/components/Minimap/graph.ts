import {
  getEdges,
  getNodes,
  Graph,
  newGraph,
  PositionedGraph,
  PositionedNode,
  RoutedEdge
} from '@/graph-lib';
import { CurveDef, LabelDef, ShapeDef } from '@/graph-svg';
import { CSSProperties } from 'react';
import { MinimapProps } from './Minimap';

const NODE_SPACING = 50;
const NODE_RADIUS = 15;

function graphHeight(props: MinimapProps): number {
  return props.loopBack !== undefined ? 5 * NODE_RADIUS : 3 * NODE_RADIUS;
}

function graphWidth(props: MinimapProps): number {
  return NODE_SPACING * (props.length - 1) + 3 * NODE_RADIUS;
}

function generateMinimapGraph(props: MinimapProps): PositionedGraph {
  const { length, loopBack } = props;

  const nodes: PositionedNode[] = [];
  const edges: RoutedEdge[] = [];

  const width = NODE_SPACING * (length - 1);
  const start = -width / 2;
  const y = loopBack !== undefined ? NODE_RADIUS / 2 : 0;

  for (let i = 0; i < length; ++i) {
    nodes.push({
      id: `${i}`,
      x: start + i * NODE_SPACING,
      y
    });
    if (i < length - 1) {
      edges.push({
        id: `${i}->${i + 1}`,
        source: `${i}`,
        target: `${i + 1}`
      });
    } else {
      if (loopBack !== undefined) {
        edges.push({
          id: `${i}->${loopBack}`,
          source: `${i}`,
          target: `${loopBack}`,
          waypoints: [
            { x: start + i * NODE_SPACING, y: y - 2 * NODE_RADIUS },
            { x: start + loopBack * NODE_SPACING, y: y - 2 * NODE_RADIUS }
          ]
        });
      }
    }
  }

  return newGraph(nodes, edges);
}

function edgeCurves(graph: Graph): Record<string, CurveDef> {
  const edgeCurves: Record<string, CurveDef> = {};
  getEdges(graph).forEach((edge) => {
    edgeCurves[edge.id] = {
      type: 'line'
    };
  });
  return edgeCurves;
}

function edgeStyles(graph: Graph): Record<string, CSSProperties> {
  const edgeStyles: Record<string, CSSProperties> = {};
  getEdges(graph).forEach((edge) => {
    edgeStyles[`${edge.id}`] = {
      stroke: 'var(--ccd-minimap-edge)',
      strokeWidth: 1,
      fill: 'none'
    };
  });
  return edgeStyles;
}

function nodeLabels(
  graph: Graph,
  current: number,
  selectedIndices?: number[]
): Record<string, LabelDef[]> {
  const selected = new Set((selectedIndices ?? [current]).map(String));
  const nodeLabels: Record<string, LabelDef[]> = {};
  getNodes(graph).forEach((node) => {
    const isSelected = selected.has(node.id);
    const isCurrent = node.id === `${current}`;
    nodeLabels[`${node.id}`] = [
      {
        text: node.id,
        style: {
          // Selected circles are filled with the accent, so their label needs
          // the on-accent colour (themed per light/dark); others use the stroke.
          fill: isSelected
            ? 'var(--ccd-minimap-node-active-label)'
            : 'var(--ccd-minimap-node-stroke)',
          fontFamily: 'monospace',
          fontSize: '10px',
          fontWeight: isCurrent ? 'bold' : 'normal',
          textAnchor: 'middle',
          userSelect: 'none',
          cursor: 'pointer'
        },
        props: {
          dy: '0.4em'
        }
      }
    ];
  });
  return nodeLabels;
}

function nodeShapes(graph: Graph): Record<string, ShapeDef> {
  const nodeShapes: Record<string, ShapeDef> = {};
  getNodes(graph).forEach((node) => {
    nodeShapes[`${node.id}`] = {
      shape: 'circle',
      radius: NODE_RADIUS
    };
  });
  return nodeShapes;
}

function nodeStyles(
  graph: Graph,
  current: number,
  selectedIndices?: number[]
): Record<string, CSSProperties> {
  // Every rendered state is "selected" (filled); the current/anchor state also
  // gets a stronger, thicker ring so it stands out within the selected set
  // (e.g. the centre of a sliding window).
  const selected = new Set((selectedIndices ?? [current]).map(String));
  const nodeStyles: Record<string, CSSProperties> = {};
  getNodes(graph).forEach((node) => {
    const isSelected = selected.has(node.id);
    const isCurrent = node.id === `${current}`;
    nodeStyles[node.id] = {
      stroke: isCurrent
        ? 'var(--ccd-minimap-selected-stroke)'
        : isSelected
        ? 'var(--ccd-minimap-node-active)'
        : 'var(--ccd-minimap-node-stroke)',
      strokeWidth: isCurrent ? 2.5 : 1,
      fill: isSelected
        ? 'var(--ccd-minimap-node-active)'
        : 'var(--ccd-minimap-node-fill)',
      cursor: 'pointer'
    };
  });
  return nodeStyles;
}

export {
  graphWidth,
  graphHeight,
  generateMinimapGraph,
  edgeCurves,
  edgeStyles,
  nodeLabels,
  nodeShapes,
  nodeStyles
};
