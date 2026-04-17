import { add, Vector2 } from '@graph-ts/vector2';
import { some } from 'lodash-es';
import createCachedSelector from 're-reselect';
import { getDragOffset } from '../store/store';
import { getWaypointsSelectionStatus } from './getWaypointsSelectionStatus';
import { getWaypointsSpread } from './getWaypointsSpread';
import { keySelectorEdgeID } from './keySelectors';

const combiner = (waypoints: Vector2[], selected: boolean[], dragOffset: Vector2) =>
    some(selected)
        ? waypoints.map((p, i) => selected[i] ? add(p, dragOffset) : p)
        : waypoints;

/**
 * Get an edge's array of waypoints that have all been
 * fully resolved (spread matrix and selection transform
 * applied).
 */
export const getWaypointsResolved = createCachedSelector(
    getWaypointsSpread,
    getWaypointsSelectionStatus,
    getDragOffset,
    combiner
)(keySelectorEdgeID);