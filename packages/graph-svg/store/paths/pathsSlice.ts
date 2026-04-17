import { Vector2 } from '@graph-ts/vector2';
import { createSlice } from '@reduxjs/toolkit';
import { createPathsState, PathsState } from './paths';
import { reducers } from './pathsReducers';

export type WaypointPositionUpdate = {
    waypointIDs: string[]
    offset: Vector2
}

const initialState: PathsState = createPathsState();

const pathsSlice = createSlice({
    name: 'paths',
    initialState,
    reducers
});

export const {
    defaultPathChanged,
    pathsChanged,
    waypointsOffset
} = pathsSlice.actions;
export default pathsSlice.reducer;