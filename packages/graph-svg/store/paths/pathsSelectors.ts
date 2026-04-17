import { PathsState } from './paths';

export const getDefaultPath = (state: PathsState) =>
    state.defaultPath;
export const getPath = (state: PathsState, edgeID: string) =>
    state.byID[edgeID] || getDefaultPath(state);
export const getWaypoints = (state: PathsState, edgeID: string) =>
    getPath(state, edgeID).waypoints;