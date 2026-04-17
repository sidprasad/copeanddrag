import { angle, translate, Vector2 } from '@/vector2';
import { intersect, line, slope } from '../../graph-svg/math/line';

export function edgePointRectangle(
  center: Vector2,
  width: number,
  height: number,
  direction: Vector2,
  strokeWidth: number
): Vector2 {
  const ng = angle(direction);
  const w = width + strokeWidth;
  const h = height + strokeWidth;
  const hw = w / 2;
  const hh = h / 2;
  const p = translate(center, ng, Math.max(w, h));
  const ray = line(center, p);

  const m = slope(ray);
  const hsw = m * hw;
  const hsh = hh / m;

  const tr: Vector2 = { x: center.x + hw, y: center.y + hh };
  const tl: Vector2 = { x: center.x - hw, y: center.y + hh };
  const br: Vector2 = { x: center.x + hw, y: center.y - hh };
  const bl: Vector2 = { x: center.x - hw, y: center.y - hh };

  if (-hh <= hsw && hsw <= hh) {
    if (center.x < p.x) return intersect(line(tr, br), ray);
    if (center.x > p.x) return intersect(line(tl, bl), ray);
  }
  if (-hw <= hsh && hsh <= hw) {
    if (center.y < p.y) return intersect(line(tl, tr), ray);
    if (center.y > p.y) return intersect(line(bl, br), ray);
  }

  return center;
}
