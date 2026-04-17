import { defaultCirclePorts } from '../shape/circle/circleUtil';
import { defaultRectanglePorts } from '../shape/rectangle/rectangleUtil';
import { PortSet, ShapeDef } from '../types';

export function defaultPorts (shape: ShapeDef): PortSet {
    switch (shape.shape) {
        case 'rectangle':
            return defaultRectanglePorts(shape);
        case 'circle':
            return defaultCirclePorts(shape);
    }
    return {};
}