import { Vector2 } from '@graph-ts/vector2';
import createCachedSelector from 're-reselect';
import { Matrix, applyToPoints } from 'transformation-matrix';
import { getSpreadMatrix } from '../store/store';
import { getWaypointsArray } from './getWaypointsArray';
import { keySelectorEdgeID } from './keySelectors';

const combiner = (waypoints: Vector2[], spread: Matrix): Vector2[] =>
    applyToPoints(spread, waypoints);

/**
 * Get an edge's array of waypoints that have all had
 * the spread matrix applied.
 */
export const getWaypointsSpread = createCachedSelector(
    getWaypointsArray,
    getSpreadMatrix,
    combiner
)(keySelectorEdgeID);