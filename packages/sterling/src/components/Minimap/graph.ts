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
      stroke: '#4A5568',
      strokeWidth: 1,
      fill: 'none'
    };
  });
  return edgeStyles;
}

function nodeLabels(graph: Graph, current: number): Record<string, LabelDef[]> {
  const nodeLabels: Record<string, LabelDef[]> = {};
  getNodes(graph).forEach((node) => {
    const active = node.id === `${current}`;
    nodeLabels[`${node.id}`] = [
      {
        text: node.id,
        style: {
          fill: active ? 'white' : '#4A5568',
          fontFamily: 'monospace',
          fontSize: '10px',
          fontWeight: active ? 'bold' : 'normal',
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
  current: number
): Record<string, CSSProperties> {
  const nodeStyles: Record<string, CSSProperties> = {};
  getNodes(graph).forEach((node) => {
    const active = node.id === `${current}`;
    nodeStyles[node.id] = {
      stroke: active ? '#3B82F6' : '#4A5568',
      strokeWidth: 1,
      fill: active ? '#3B82F6' : 'white',
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
