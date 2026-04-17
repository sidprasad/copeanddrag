import { Vector2 } from 'vector2';
import { PayloadAction } from '@reduxjs/toolkit';
import { Edge, getEdge, getNode, Graph, PositionedNode } from '@/graph-lib';
import { SelectionState, SelectionUpdate } from './selection';

/**
 * A reducer that responds to changes in the drag offset.
 *
 * When the user is dragging the mouse, the drag offset represents the distance in
 * pixels between the current mouse position and the position where the mouse button
 * was initially downed. This reducer changes that value in the store when the mouse
 * is dragged.
 */
const dragOffsetChanged = (state: SelectionState, action: PayloadAction<Vector2>) => {
    state.dragOffset = action.payload;
};

/**
 * A reducer that responds to changes in the graph.
 *
 * When the graph is changed, this reducer checks if any nodes or edges that have been
 * removed from the graph are in the selection and removes them from the selection. It
 * also performs the same check for hovered nodes and edges.
 */
const graphChanged = <N extends PositionedNode, E extends Edge> (state: SelectionState, action: PayloadAction<Graph<N, E>>) => {
    const g = action.payload;
    state.edgeIDs = state.edgeIDs.filter(edgeID => getEdge(g, edgeID) !== undefined);
    state.nodeIDs = state.nodeIDs.filter(nodeID => getNode(g, nodeID) !== undefined);

    if (state.hoveredEdgeID && !getEdge(g, state.hoveredEdgeID))
        state.hoveredEdgeID = null;

    if (state.hoveredNodeID && !getNode(g, state.hoveredNodeID))
        state.hoveredNodeID = null;
};

/**
 * A reducer that responds to changes in the selection.
 *
 * This reducer sets the selection in the selection slice.
 */
const selectionChanged = (state: SelectionState, action: PayloadAction<SelectionUpdate>) => {

    const { nodes, edges, waypoints } = action.payload;
    if (nodes) {
        state.nodeIDs = nodes.selection;
        state.hoveredNodeID = nodes.hover;
    }
    if (edges) {
        state.edgeIDs = edges.selection;
        state.hoveredEdgeID = edges.hover;
    }
    if (waypoints) {
        state.waypointIDs = waypoints.selection;
        state.hoveredWaypointID = waypoints.hover;
    }

};

const reducers = {
    dragOffsetChanged,
    selectionChanged
}

const extraReducers = {
    graphChanged
};

export { reducers, extraReducers };