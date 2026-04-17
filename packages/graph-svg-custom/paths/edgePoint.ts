import { ShapeDef } from '@/graph-svg';
import { Vector2 } from '@/vector2';
import { edgePointCircle } from './edgePointCircle';
import { edgePointRectangle } from './edgePointRectangle';

export function edgePoint(
  center: Vector2,
  shape: ShapeDef,
  direction: Vector2,
  strokeWidth: number
): Vector2 {
  switch (shape.shape) {
    case 'circle':
      return edgePointCircle(center, shape.radius, direction, strokeWidth);
    case 'rectangle':
      return edgePointRectangle(
        center,
        shape.width,
        shape.height,
        direction,
        strokeWidth
      );
  }
  return center;
}
