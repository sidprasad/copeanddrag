import { Vector2 } from '@graph-ts/vector2';
import { includes } from 'lodash-es';
import createCachedSelector from 're-reselect';
import { createWaypointID } from '../components/waypoint/waypointUtils';
import { getSelectedWaypointIDs } from '../store/store';
import { getWaypointsArray } from './getWaypointsArray';
import { keySelectorEdgeID } from './keySelectors';

const combiner = (edgeID: string, waypoints: Vector2[], selectedWaypointIDs: string[]) =>
    waypoints.map((_, i) =>
        includes(selectedWaypointIDs, createWaypointID(edgeID, i)));

/**
 * Get a boolean array indicating whether each waypoint is
 * in the current selection.
 */
export const getWaypointsSelectionStatus = createCachedSelector(
    keySelectorEdgeID,
    getWaypointsArray,
    getSelectedWaypointIDs,
    combiner
)(keySelectorEdgeID);