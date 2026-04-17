import { getEdges, Graph } from '@/graph-lib';
import { CSSProperties } from 'react';
import { edgeStyle } from './styles';

export function buildEdgeStyles(graph: Graph): Record<string, CSSProperties> {
  const edgeStyles: Record<string, CSSProperties> = {};
  getEdges(graph).forEach((edge) => {
    edgeStyles[edge.id] = edgeStyle;
  });
  return edgeStyles;
}
