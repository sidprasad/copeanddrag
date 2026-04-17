import { angle, translate, Vector2 } from '@/vector2';

export function edgePointCircle(
  center: Vector2,
  radius: number,
  direction: Vector2,
  strokeWidth: number
): Vector2 {
  return translate(center, angle(direction), radius + strokeWidth / 2);
}
