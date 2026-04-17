import { Vector2 } from '@graph-ts/vector2';
import { ShapeDef } from '../types';
import { edgePointCircle } from './circle/circleUtil';
import { edgePointRectangle } from './rectangle/rectangleUtil';

export function edgePoint (center: Vector2, direction: Vector2, shape: ShapeDef, strokeWidth: number, markerSize: number): Vector2 {
    switch (shape.shape) {
        case 'circle':
            return edgePointCircle(center, direction, +shape.radius, strokeWidth, markerSize);
        case 'rectangle':
            return edgePointRectangle(center, direction, +shape.width, +shape.height, strokeWidth, markerSize);
    }
    return center;
}