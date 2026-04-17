import { Vector2 } from '@graph-ts/vector2';
import createCachedSelector from 're-reselect';
import { getEdgeSourcePortResolved } from './getEdgeSourcePortResolved';
import { getEdgeTargetPortResolved } from './getEdgeTargetPortResolved';
import { getWaypointsResolved } from './getWaypointsResolved';
import { keySelectorEdgeID } from './keySelectors';

const combiner = (source: Vector2, waypoints: Vector2[], target: Vector2): Vector2[] =>
    [source, ...waypoints, target];

/**
 * Get the points that are used to render an edge's path.
 */
export const getResolvedPathPoints = createCachedSelector(
    getEdgeSourcePortResolved,
    getWaypointsResolved,
    getEdgeTargetPortResolved,
    combiner
)(keySelectorEdgeID);