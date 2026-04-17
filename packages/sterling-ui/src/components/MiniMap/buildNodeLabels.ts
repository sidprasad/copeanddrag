import { getNodes, Graph } from '@/graph-lib';
import { LabelDef } from '@/graph-svg';
import { nodeLabel, selectedNodeLabel } from './styles';

export function buildNodeLabels(
  graph: Graph,
  selectedIndices: number[]
): Record<string, LabelDef[]> {
  const nodeLabels: Record<string, LabelDef[]> = {};
  getNodes(graph).forEach((node) => {
    nodeLabels[node.id] = selectedIndices.includes(+node.id)
      ? [{ text: node.id, ...selectedNodeLabel }]
      : [{ text: node.id, ...nodeLabel }];
  });
  return nodeLabels;
}
