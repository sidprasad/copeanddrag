import { getNodes, Graph } from '@/graph-lib';
import { ShapeDef } from '@/graph-svg';
import { nodeShape } from './styles';

export function buildNodeShapes(graph: Graph): Record<string, ShapeDef> {
  const nodeShapes: Record<string, ShapeDef> = {};
  getNodes(graph).forEach((node) => {
    nodeShapes[node.id] = nodeShape;
  });
  return nodeShapes;
}
