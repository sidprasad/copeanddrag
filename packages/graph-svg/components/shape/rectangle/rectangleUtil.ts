import { angle, translate, Vector2 } from '@graph-ts/vector2';
import { intersect, line, slope } from '../../../math/line';
import { PortSet, RectangleDef } from '../../types';

export function defaultRectanglePorts (rectangle: RectangleDef): PortSet {
    const hw = +rectangle.width / 2;
    const hh = +rectangle.height / 2;
    return {
        top: { id: 'top', x: 0, y: hh },
        right: { id: 'right', x: hw, y: 0 },
        bottom: { id: 'bottom', x: 0, y: -hh },
        left: { id: 'left', x: -hw, y: 0 }
    };
}

export function edgePointRectangle (
    center: Vector2, direction: Vector2,
    width: number, height: number, strokeWidth: number, markerSize: number): Vector2 {

    const ng = angle(direction);
    const w = width + strokeWidth + 2 * Math.abs(Math.cos(ng)) * markerSize;
    const h = height + strokeWidth + 2 * Math.abs(Math.sin(ng)) * markerSize;
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