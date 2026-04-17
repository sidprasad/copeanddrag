import { SelectionState } from './selection';

export const areDraggablesSelected = (state: SelectionState) =>
    state.nodeIDs.length || state.waypointIDs.length;
export const getDragOffset = (state: SelectionState) =>
    state.dragOffset;
export const getHoveredEdgeID = (state: SelectionState) =>
    state.hoveredEdgeID;
export const getHoveredNodeID = (state: SelectionState) =>
    state.hoveredNodeID;
export const getHoveredWaypointID = (state: SelectionState) =>
    state.hoveredWaypointID;
export const getSelectedEdgeIDs = (state: SelectionState) =>
    state.edgeIDs;
export const getSelectedNodeIDs = (state: SelectionState) =>
    state.nodeIDs;
export const getSelectedWaypointIDs = (state: SelectionState) =>
    state.waypointIDs;