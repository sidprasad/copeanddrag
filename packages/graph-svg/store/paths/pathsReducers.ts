import { add, Vector2 } from '@graph-ts/vector2';
import { PayloadAction } from '@reduxjs/toolkit';
import { defaultTo } from 'lodash-es';
import { EDGE_PATH } from '../../components/defaults';
import { Dict, PathDef } from '../../components/types';
import { parseWaypointID } from '../../components/waypoint/waypointUtils';
import { PathsState } from './paths';
import { getWaypoints } from './pathsSelectors';
import { WaypointPositionUpdate } from './pathsSlice';

/**
 * A reducer that responds to changes in the default path.
 */
const defaultPathChanged = (state: PathsState, action: PayloadAction<PathDef | undefined>) => {
    state.defaultPath = defaultTo(action.payload, EDGE_PATH);
};

/**
 * A reducer that responds to changes in path definitions for specific edges.
 */
const pathsChanged = (state: PathsState, action: PayloadAction<Dict<PathDef>>) => {
    state.byID = action.payload;
};

/**
 * A reducer that responds to changes in waypoint offsets.
 */
const waypointsOffset = (state: PathsState, action: PayloadAction<WaypointPositionUpdate>) => {

    const { waypointIDs, offset } = action.payload;

    waypointIDs.forEach(waypointID => {
        const [edgeID, index] = parseWaypointID(waypointID);
        const waypoints = getWaypoints(state, edgeID);
        if (waypoints) {
            const waypoint: Vector2 = waypoints[index];
            if (waypoint)
                waypoints[index] = add(waypoint, offset);
        }
    });

};

const reducers = {
    defaultPathChanged,
    pathsChanged,
    waypointsOffset
};

export { reducers };