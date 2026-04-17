import { getNodes, Graph } from '@/graph-lib';
import { CSSProperties } from 'react';
import { nodeStyle } from './styles';

export function buildNodeStyles(graph: Graph): Record<string, CSSProperties> {
  const nodeStyles: Record<string, CSSProperties> = {};
  getNodes(graph).forEach((node) => {
    nodeStyles[node.id] = nodeStyle;
  });
  return nodeStyles;
}
