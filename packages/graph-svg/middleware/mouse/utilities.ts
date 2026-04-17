import { includes } from 'lodash-es';
import { getSelectedEdgeIDs, getSelectedNodeIDs, getSelectedWaypointIDs, RootState } from '../../store/store';

/**
 * Map an array of edge IDs to their current selection status.
 */
export function getEdgeSelectionStatus (state: RootState, edgeIDs: string[]): boolean[] {
    const selectedEdgeIDs = getSelectedEdgeIDs(state);
    return edgeIDs.map(edgeID => includes(selectedEdgeIDs, edgeID));
}

/**
 * Map an array of node IDs to their current selection status.
 */
export function getNodeSelectionStatus (state: RootState, nodeIDs: string[]): boolean[] {
    const selectedNodeIDs = getSelectedNodeIDs(state);
    return nodeIDs.map(nodeID => includes(selectedNodeIDs, nodeID));
}

/**
 * Map an array of waypoints to their current selection status.
 */
export function getWaypointSelectionStatus (state: RootState, waypointIDs: string[]): boolean[] {
    const selectedWaypoints = getSelectedWaypointIDs(state);
    return waypointIDs.map(waypointID => includes(selectedWaypoints, waypointID));
}
