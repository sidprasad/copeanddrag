import { StylesState } from './styles';

export const getDefaultEdgeStyle = (state: StylesState) =>
    state.edgeDefault;
export const getDefaultNodeStyle = (state: StylesState) =>
    state.nodeDefault;
export const getEdgeStyle = (state: StylesState, edgeID: string) =>
    state.edgeStyles[edgeID];
export const getEdgeStyles = (state: StylesState) =>
    state.edgeStyles;
export const getEdgeStyleDef = (state: StylesState, edgeID: string) =>
    state.edgeDefs.style[edgeID];
export const getEdgeStyleHoveredDef = (state: StylesState, edgeID: string) =>
    state.edgeDefs.hovered[edgeID];
export const getEdgeStyleSelectedDef = (state: StylesState, edgeID: string) =>
    state.edgeDefs.selected[edgeID];
export const getNodeStyle = (state: StylesState, nodeID: string) =>
    state.nodeStyles[nodeID];
export const getNodeStyleDef = (state: StylesState, nodeID: string) =>
    state.nodeDefs.style[nodeID];
export const getNodeStyleHoveredDef = (state: StylesState, nodeID: string) =>
    state.nodeDefs.hovered[nodeID];
export const getNodeStyleSelectedDef = (state: StylesState, nodeID: string) =>
    state.nodeDefs.selected[nodeID];
export const getWaypointStyles = (state: StylesState) =>
    state.waypoint;