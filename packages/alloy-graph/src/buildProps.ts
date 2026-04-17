import { AlloyGraph } from '@/alloy-graph';
import { getEdges, getNodes } from '@/graph-lib';
import {
  CurveDef,
  EdgeLabelDef,
  GraphProps,
  NodeLabelDef,
  ShapeDef
} from '@/graph-svg';
import { CSSProperties } from 'react';

/**
 * TODO: Add theme as a parameter
 * @param id
 * @param graph
 */
export function buildProps(id: string, graph: AlloyGraph): GraphProps {
  const nodeShapes: Record<string, ShapeDef> = {};
  const nodeStyles: Record<string, CSSProperties> = {};
  const nodeLabels: Record<string, NodeLabelDef[]> = {};
  const edgeCurves: Record<string, CurveDef> = {};
  const edgeStyles: Record<string, CSSProperties> = {};
  const edgeLabels: Record<string, EdgeLabelDef[]> = {};
  getNodes(graph).forEach((node) => {
    nodeShapes[node.id] = {
      shape: 'rectangle',
      width: 100,
      height: 60
    };
    nodeStyles[node.id] = {
      stroke: 'none',
      fill: 'steelblue'
    };
    nodeLabels[node.id] = [
      {
        text: node.atom.id,
        style: {
          fill: 'white',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          textAnchor: 'middle'
        },
        props: {
          dy: '0.33em'
        }
      }
    ];
  });
  getEdges(graph).forEach((edge) => {
    edgeCurves[edge.id] = {
      type: 'bspline'
    };
    edgeStyles[edge.id] = {
      stroke: '#333',
      fill: 'none'
    };
    edgeLabels[edge.id] = [
      {
        text: edge.relation,
        style: {
          fill: '#333',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          textAnchor: 'middle'
        },
        props: {
          dy: '0.33em'
        }
      }
    ];
  });
  return {
    id,
    graph,
    nodeShapes,
    nodeStyles,
    nodeLabels,
    edgeCurves,
    edgeLabels,
    edgeStyles
  };
}
