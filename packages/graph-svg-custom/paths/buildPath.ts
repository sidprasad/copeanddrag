import { PositionedNode, RoutedEdge } from '@/graph-lib';
import { ShapeDef } from '@/graph-svg';
import { add, subtract, Vector2 } from '@/vector2';
import { defaultTo } from 'lodash-es';
import { applyToPoint, Matrix } from 'transformation-matrix';
import { edgePoint } from './edgePoint';

export function buildPath<N extends PositionedNode, E extends RoutedEdge>(
  edge: E,
  source: N,
  sourceShape: ShapeDef,
  sourceOffset: Vector2,
  target: N,
  targetShape: ShapeDef,
  targetOffset: Vector2,
  spreadMatrix: Matrix
): Vector2[] {
  const waypoints = edge.waypoints || [];

  const src = applyToPoint(spreadMatrix, add(source, sourceOffset));
  const trg = applyToPoint(spreadMatrix, add(target, targetOffset));
  const wps = waypoints.map((pt) => applyToPoint(spreadMatrix, pt));

  const sourceAdj = defaultTo(wps[0], trg);
  const sourceDir = subtract(sourceAdj, src);
  const sourcePoint = edgePoint(src, sourceShape, sourceDir, 0);

  const targetAdj = defaultTo(wps[wps.length - 1], src);
  const targetDir = subtract(targetAdj, trg);
  const targetPoint = edgePoint(trg, targetShape, targetDir, 0);
  return [sourcePoint, ...wps, targetPoint];
}
