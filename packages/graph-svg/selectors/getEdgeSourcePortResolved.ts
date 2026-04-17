import { add, subtract, Vector2 } from '@graph-ts/vector2';
import { defaultTo } from 'lodash-es';
import createCachedSelector from 're-reselect';
import { CSSProperties } from 'react';
import { visibleStrokeWidth } from '../components/path/pathUtils';
import { edgePoint } from '../components/shape/shapeUtil';
import { PortSet, ShapeDef } from '../components/types';
import { getEdgeSourceStyle, getSourcePortID, getSourcePorts, getSourceShape } from '../store/store';
import { getEdgeSourceResolved } from './getEdgeSourceResolved';
import { getEdgeTargetResolved } from './getEdgeTargetResolved';
import { getWaypointsResolved } from './getWaypointsResolved';
import { keySelectorEdgeID } from './keySelectors';

const combiner = (
    source: Vector2,
    target: Vector2,
    waypoints: Vector2[],
    sourcePortID: string | undefined,
    shape: ShapeDef,
    ports: PortSet,
    style: CSSProperties): Vector2 => {

    // If a port is specified, calculate and return its absolute position
    if (sourcePortID) return add(source, ports[sourcePortID]);

    // Otherwise calculate a floating port
    const adjacent: Vector2 = defaultTo(waypoints[0], target);
    const direction: Vector2 = subtract(adjacent, source);
    const stroke = visibleStrokeWidth(style);

    return edgePoint(source, direction, shape, stroke, 0);

};

/**
 * Get the point on the edge of the source node's shape
 * that the edge will attach to.
 */
export const getEdgeSourcePortResolved = createCachedSelector(
    getEdgeSourceResolved,
    getEdgeTargetResolved,
    getWaypointsResolved,
    getSourcePortID,
    getSourceShape,
    getSourcePorts,
    getEdgeSourceStyle,
    combiner
)(keySelectorEdgeID);