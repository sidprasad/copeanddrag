import { getEdges, Graph } from '@/graph-lib';
import { CurveDef } from '@/graph-svg';

export const DEFAULT_EDGE_CURVE: CurveDef = {
  type: 'bspline'
};

export function buildEdgeCurves(graph: Graph): Record<string, CurveDef> {
  const edgeCurves: Record<string, CurveDef> = {};
  getEdges(graph).forEach((edge) => {
    edgeCurves[edge.id] = DEFAULT_EDGE_CURVE;
  });
  return edgeCurves;
}
