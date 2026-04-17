import { angle, translate, Vector2 } from '@graph-ts/vector2';
import { CircleDef, PortSet } from '../../types';

export function defaultCirclePorts (circle: CircleDef): PortSet {
    const r = +circle.radius;
    return {
        top: { id: 'top', x: 0, y: r },
        right: { id: 'right', x: r, y: 0 },
        bottom: { id: 'bottom', x: 0, y: -r },
        left: { id: 'left', x: -r, y: 0 }
    };
}

export function edgePointCircle (
    center: Vector2, direction: Vector2,
    radius: number, strokeWidth: number, markerSize: number): Vector2 {

    return translate(center, angle(direction), radius + strokeWidth / 2 + markerSize);

}