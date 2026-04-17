import { add, subtract, Vector2 } from '@graph-ts/vector2';
import { defaultTo } from 'lodash-es';
import createCachedSelector from 're-reselect';
import { CSSProperties } from 'react';
import { visibleStrokeWidth } from '../components/path/pathUtils';
import { edgePoint } from '../components/shape/shapeUtil';
import { PortSet, ShapeDef } from '../components/types';
import { getEdgeTargetStyle, getTargetPortID, getTargetPorts, getTargetShape } from '../store/store';
import { getEdgeSourceResolved } from './getEdgeSourceResolved';
import { getEdgeTargetResolved } from './getEdgeTargetResolved';
import { getWaypointsResolved } from './getWaypointsResolved';
import { keySelectorEdgeID } from './keySelectors';

const combiner = (
    source: Vector2,
    target: Vector2,
    waypoints: Vector2[],
    targetPortID: string | undefined,
    shape: ShapeDef,
    ports: PortSet,
    style: CSSProperties): Vector2 => {

    // If a port is specified, calculate and return its absolute position
    if (targetPortID) return add(target, ports[targetPortID]);

    // Otherwise calculate a floating port
    const adjacent: Vector2 = defaultTo(waypoints[waypoints.length - 1], source);
    const direction: Vector2 = subtract(adjacent, target);
    const stroke = visibleStrokeWidth(style);

    return edgePoint(target, direction, shape, stroke, 0);

};

/**
 * Get the point on the edge of the target node's shape
 * that the edge will attach to.
 */
export const getEdgeTargetPortResolved = createCachedSelector(
    getEdgeSourceResolved,
    getEdgeTargetResolved,
    getWaypointsResolved,
    getTargetPortID,
    getTargetShape,
    getTargetPorts,
    getEdgeTargetStyle,
    combiner
)(keySelectorEdgeID);