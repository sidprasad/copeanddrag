import { add, subtract, Vector2 } from '@graph-ts/vector2';
import {
    curveBasis,
    curveBundle,
    curveCardinal,
    curveCatmullRom,
    curveLinear,
    curveMonotoneX,
    curveMonotoneY,
    curveNatural,
    curveStep,
    curveStepAfter,
    curveStepBefore,
    Line,
    line
} from 'd3-shape';
import { assign, defaultTo, omit } from 'lodash-es';
import { CSSProperties } from 'react';
import { Matrix } from 'transformation-matrix';
import { edgePoint } from '../shape/shapeUtil';
import { PathDef, PathDefResolved, PortSet, ShapeDef } from '../types';

export function visibleStrokeWidth (style: CSSProperties): number {
    return style.stroke && style.stroke !== 'none'
        ? +defaultTo(style.strokeWidth, 1)
        : 0;
}

export function buildPathGenerator (pathDef: PathDef): Line<Vector2> {

    const generator = line<Vector2>()
        .x(d => d.x)
        .y(d => d.y)

    switch (pathDef.type) {
        case 'bspline':
            generator.curve(curveBasis);
            break;
        case 'bundle':
            generator.curve(curveBundle.beta(defaultTo(pathDef.beta, 0.85)));
            break;
        case 'cardinal':
            generator.curve(curveCardinal.tension(defaultTo(pathDef.tension, 0)));
            break;
        case 'catmullrom':
            generator.curve(curveCatmullRom.alpha(defaultTo(pathDef.alpha, 0.5)));
            break;
        case 'line':
            generator.curve(curveLinear);
            break;
        case 'monotonex':
            generator.curve(curveMonotoneX);
            break;
        case 'monotoney':
            generator.curve(curveMonotoneY);
            break;
        case 'natural':
            generator.curve(curveNatural);
            break;
        case 'step':
            generator.curve(curveStep);
            break;
        case 'stepafter':
            generator.curve(curveStepAfter);
            break;
        case 'stepbefore':
            generator.curve(curveStepBefore);
            break;
        default:
            generator.curve(curveLinear);
    }

    return generator;
}

/**
 * TODO: remove spreadTransform
 */
export function resolvePathDef (path: PathDef, spreadTransform: Matrix,
                                source: Vector2, sourceShape: ShapeDef, sourceStyle: CSSProperties, sourcePorts: PortSet,
                                target: Vector2, targetShape: ShapeDef, targetStyle: CSSProperties, targetPorts: PortSet,
                                waypoints: Vector2[]): PathDefResolved {

    const srcAdj: Vector2 = defaultTo(waypoints[0], target);
    const trgAdj: Vector2 = defaultTo(waypoints[waypoints.length - 1], source);

    const srcStroke = visibleStrokeWidth(sourceStyle);
    const trgStroke = visibleStrokeWidth(targetStyle);

    const srcPoint = defaultTo(
        sourcePort(source, path, sourcePorts),
        edgePoint(source, subtract(srcAdj, source), sourceShape, srcStroke, 0)
    );

    const trgPoint = defaultTo(
        targetPort(target, path, targetPorts),
        edgePoint(target, subtract(trgAdj, target), targetShape, trgStroke, 0)
    );

    const points: Vector2[] = [
        srcPoint,
        ...waypoints,
        trgPoint
    ];

    const resolvedPathDef: PathDefResolved = assign(
        omit(path, 'waypoints'),
        { points: points }
    );

    return resolvedPathDef;

}

function sourcePort (source: Vector2, path: PathDef, sourcePorts: PortSet): Vector2 | undefined {
    if (path.sourcePort) {
        const sourcePort = sourcePorts[path.sourcePort];
        if (sourcePort)
            return add(source, sourcePort);
    }
}

function targetPort (target: Vector2, path: PathDef, targetPorts: PortSet): Vector2 | undefined {
    if (path.targetPort) {
        const targetPort = targetPorts[path.targetPort];
        if (targetPort)
            return add(target, targetPort);
    }
}