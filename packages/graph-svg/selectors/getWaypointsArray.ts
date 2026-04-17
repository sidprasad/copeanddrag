import { Vector2 } from '@graph-ts/vector2';
import { defaultTo } from 'lodash-es';
import createCachedSelector from 're-reselect';
import { getWaypoints } from '../store/store';
import { keySelectorEdgeID } from './keySelectors';

const empty: Vector2[] = [];
const combiner = (waypoints: Vector2[] | undefined): Vector2[] =>
    defaultTo(waypoints, empty);

/**
 * Get an edge's array of waypoints.
 *
 * An edge's waypoints can either be an array of Vector2 or
 * undefined. This function returns an empty array if the
 * waypoints are undefined. The same empty array is always
 * used so that subsequent selectors are not invalidated.
 */
export const getWaypointsArray = createCachedSelector(
    getWaypoints,
    combiner
)(keySelectorEdgeID);