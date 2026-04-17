import { configureStore } from '@reduxjs/toolkit';
import * as graphSelectors from './graph/graphSelectors';
import graphReducer from './graph/graphSlice';
import * as labelsSelectors from './labels/labelsSelectors';
import labelsReducer from './labels/labelsSlice';
import * as pathsSelectors from './paths/pathsSelectors';
import pathsReducer from './paths/pathsSlice';
import * as selectionSelectors from './selection/selectionSelectors';
import selectionReducer from './selection/selectionSlice';
import * as shapesSelectors from './shapes/shapesSelectors';
import shapesReducer from './shapes/shapesSlice';
import * as stylesSelectors from './styles/stylesSelectors';
import stylesReducer from './styles/stylesSlice';

/**
 * This is a dummy store that isn't ever actually used in
 * production. It's here to we can get the RootState type.
 */
const store = configureStore({
    reducer: {
        graph: graphReducer,
        labels: labelsReducer,
        paths: pathsReducer,
        selection: selectionReducer,
        shapes: shapesReducer,
        styles: stylesReducer
    },
    devTools: false,
    middleware: []
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const getEdge = (state: RootState, edgeID: string) =>
    graphSelectors.getEdge(state.graph, edgeID);
export const getEdgeIDs = (state: RootState) =>
    graphSelectors.getEdgeIDs(state.graph);
export const getEdgeSource = (state: RootState, edgeID: string) =>
    graphSelectors.getEdgeSource(state.graph, edgeID);
export const getEdgeSourceID = (state: RootState, edgeID: string) =>
    graphSelectors.getEdgeSourceID(state.graph, edgeID);
export const getEdgeTarget = (state: RootState, edgeID: string) =>
    graphSelectors.getEdgeTarget(state.graph, edgeID);
export const getEdgeTargetID = (state: RootState, edgeID: string) =>
    graphSelectors.getEdgeTargetID(state.graph, edgeID);
export const getGraph = (state: RootState) =>
    graphSelectors.getGraph(state.graph);
export const getNode = (state: RootState, nodeID: string) =>
    graphSelectors.getNode(state.graph, nodeID);
export const getNodeIDs = (state: RootState) =>
    graphSelectors.getNodeIDs(state.graph);
export const getSpreadMatrix = (state: RootState) =>
    graphSelectors.getSpreadMatrix(state.graph);

export const getEdgeLabel = (state: RootState, id: string) =>
    labelsSelectors.getEdgeLabel(state.labels, id);
export const getNodeLabel = (state: RootState, id: string) =>
    labelsSelectors.getNodeLabel(state.labels, id);

export const getPath = (state: RootState, edgeID: string) =>
    pathsSelectors.getPath(state.paths, edgeID);
export const getSourcePortID = (state: RootState, edgeID: string) =>
    getPath(state, edgeID).sourcePort;
export const getTargetPortID = (state: RootState, edgeID: string) =>
    getPath(state, edgeID).targetPort;
export const getWaypoints = (state: RootState, edgeID: string) =>
    pathsSelectors.getWaypoints(state.paths, edgeID);

export const areDraggablesSelected = (state: RootState) =>
    selectionSelectors.areDraggablesSelected(state.selection);
export const getDragOffset = (state: RootState) =>
    selectionSelectors.getDragOffset(state.selection);
export const getHoveredEdgeID = (state: RootState) =>
    selectionSelectors.getHoveredEdgeID(state.selection);
export const getHoveredNodeID = (state: RootState) =>
    selectionSelectors.getHoveredNodeID(state.selection);
export const getHoveredWaypointID = (state: RootState) =>
    selectionSelectors.getHoveredWaypointID(state.selection);
export const getSelectedEdgeIDs = (state: RootState) =>
    selectionSelectors.getSelectedEdgeIDs(state.selection);
export const getSelectedNodeIDs = (state: RootState) =>
    selectionSelectors.getSelectedNodeIDs(state.selection);
export const getSelectedWaypointIDs = (state: RootState) =>
    selectionSelectors.getSelectedWaypointIDs(state.selection);

export const getPorts = (state: RootState, nodeID: string) =>
    shapesSelectors.getPorts(state.shapes, nodeID);
export const getShape = (state: RootState, nodeID: string) =>
    shapesSelectors.getShape(state.shapes, nodeID);
export const getSourcePorts = (state: RootState, edgeID: string) =>
    shapesSelectors.getPorts(state.shapes, getEdgeSourceID(state, edgeID));
export const getSourceShape = (state: RootState, edgeID: string) =>
    shapesSelectors.getShape(state.shapes, getEdgeSourceID(state, edgeID));
export const getTargetPorts = (state: RootState, edgeID: string) =>
    shapesSelectors.getPorts(state.shapes, getEdgeTargetID(state, edgeID));
export const getTargetShape = (state: RootState, edgeID: string) =>
    shapesSelectors.getShape(state.shapes, getEdgeTargetID(state, edgeID));

export const getEdgeStyle = (state: RootState, edgeID: string) =>
    stylesSelectors.getEdgeStyle(state.styles, edgeID);
export const getEdgeStyles = (state: RootState) =>
    stylesSelectors.getEdgeStyles(state.styles);
export const getEdgeSourceStyle = (state: RootState, edgeID: string) =>
    stylesSelectors.getNodeStyle(state.styles, getEdge(state, edgeID).source);
export const getEdgeTargetStyle = (state: RootState, edgeID: string) =>
    stylesSelectors.getNodeStyle(state.styles, getEdge(state, edgeID).target);
export const getNodeStyle = (state: RootState, nodeID: string) =>
    stylesSelectors.getNodeStyle(state.styles, nodeID);
export const getWaypointStyles = (state: RootState) =>
    stylesSelectors.getWaypointStyles(state.styles);