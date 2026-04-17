import { PayloadAction } from '@reduxjs/toolkit';
import { defaultTo, keys } from 'lodash-es';
import { Edge, getEdges, getNodes, Graph, PositionedNode } from '@graph-ts/graph-lib';
import * as defaults from '../../components/defaults';
import { DynamicStyles } from '../../components/types';
import { SelectionUpdate } from '../selection/selection';
import {
    getHoveredEdgeID,
    getHoveredNodeID,
    getSelectedEdgeIDs,
    getSelectedNodeIDs
} from '../selection/selectionSelectors';
import { DefaultStyleDefUpdate, resolveEdgeStyle, resolveNodeStyle, StyleDefUpdate, StylesState } from './styles';

/**
 * A reducer that responds to changes in the default edge styles.
 *
 * When the default edge style is updated, this reducer sets the default style in the style slice and
 * resolves styles for every edge in the graph. The result is that all edges that do not have an
 * explicitly defined style will be styled using the new default.
 */
const edgeStyleDefaultsChanged = (state: StylesState, action: PayloadAction<DefaultStyleDefUpdate>) => {

    const { style, hovered, selected, selectionState } = action.payload;
    const edgeIDs = keys(state.edgeStyles);
    const hoveredEdgeID = getHoveredEdgeID(selectionState);
    const selectedEdgeIDs = new Set(getSelectedEdgeIDs(selectionState));

    state.edgeDefault.style = defaultTo(style, defaults.EDGE_STYLE);
    state.edgeDefault.hovered = defaultTo(hovered, defaults.EDGE_HOVER_STYLE);
    state.edgeDefault.selected = defaultTo(selected, defaults.EDGE_SELECTED_STYLE);

    edgeIDs.forEach(edgeID => {
        const selected = selectedEdgeIDs.has(edgeID);
        const hovered = edgeID === hoveredEdgeID;
        state.edgeStyles[edgeID] = resolveEdgeStyle(state, edgeID, hovered, selected);
    });

};

/**
 * A reducer that responds to changes in styles for specific edges.
 *
 * When edge styles are updated, this reducer sets the edge styles in the style slice and
 * resolves styles for every edge in the graph. Note that the action payload is the complete
 * set of defined styles, not just the ones being changed.
 */
const edgeStyleDefsChanged = (state: StylesState, action: PayloadAction<StyleDefUpdate>) => {

    const { style, hovered, selected, selectionState } = action.payload;
    const edgeIDs = keys(state.edgeStyles);
    const hoveredEdgeID = getHoveredEdgeID(selectionState);
    const selectedEdgeIDs = new Set(getSelectedEdgeIDs(selectionState));

    state.edgeDefs.style = style;
    state.edgeDefs.hovered = hovered;
    state.edgeDefs.selected = selected;
    edgeIDs.forEach(edgeID => {
        const selected = selectedEdgeIDs.has(edgeID);
        const hovered = edgeID === hoveredEdgeID;
        state.edgeStyles[edgeID] = resolveEdgeStyle(state, edgeID, hovered, selected);
    });

};

/**
 * A reducer that responds to changes in the graph.
 *
 * When the graph itself is changed, this reducer resolves styles for all nodes and edges in the new
 * graph. All node and edge styles from the previous graph are lost.
 */
const graphChanged = <N extends PositionedNode, E extends Edge> (state: StylesState, action: PayloadAction<Graph<N, E>>) => {

    const nodes = getNodes(action.payload);
    const edges = getEdges(action.payload);

    state.nodeStyles = {};
    state.edgeStyles = {};

    nodes.forEach(node => {
        state.nodeStyles[node.id] = resolveNodeStyle(state, node.id, false, false)
    });

    edges.forEach(edge => {
        state.edgeStyles[edge.id] = resolveEdgeStyle(state, edge.id, false, false);
    });

}

/**
 * A reducer that responds to changes in the default node styles.
 *
 * When the default node style is updated, this reducer sets the default style in the style slice and
 * resolves styles for every node in the graph. The result is that all nodes that do not have an
 * explicitly defined style will be styled using the new default.
 */
const nodeStyleDefaultsChanged = (state: StylesState, action: PayloadAction<DefaultStyleDefUpdate>) => {

    const { style, hovered, selected, selectionState } = action.payload;
    const nodeIDs = keys(state.nodeStyles);
    const hoveredNodeID = getHoveredNodeID(selectionState);
    const selectedNodeIDs = new Set(getSelectedNodeIDs(selectionState));

    state.nodeDefault.style = defaultTo(style, defaults.NODE_STYLE);
    state.nodeDefault.hovered = defaultTo(hovered, defaults.NODE_HOVER_STYLE);
    state.nodeDefault.selected = defaultTo(selected, defaults.NODE_SELECTED_STYLE);
    nodeIDs.forEach(nodeID => {
        const selected = selectedNodeIDs.has(nodeID);
        const hovered = nodeID === hoveredNodeID;
        state.nodeStyles[nodeID] = resolveNodeStyle(state, nodeID, hovered, selected);
    });

};

/**
 * A reducer that responds to changes in styles for specific nodes.
 *
 * When node styles are updated, this reducer sets the node styles in the style slice and
 * resolves styles for every node in the graph. Note that the action payload is the complete
 * set of defined styles, not just the ones being changed.
 */
const nodeStyleDefsChanged = (state: StylesState, action: PayloadAction<StyleDefUpdate>) => {

    const { style, hovered, selected, selectionState } = action.payload;
    const nodeIDs = keys(state.nodeStyles);
    const hoveredNodeID = getHoveredNodeID(selectionState);
    const selectedNodeIDs = new Set(getSelectedNodeIDs(selectionState));

    state.nodeDefs.style = style;
    state.nodeDefs.hovered = hovered;
    state.nodeDefs.selected = selected;
    nodeIDs.forEach(nodeID => {
        const selected = selectedNodeIDs.has(nodeID);
        const hovered = nodeID === hoveredNodeID;
        state.nodeStyles[nodeID] = resolveNodeStyle(state, nodeID, hovered, selected);
    });

};

/**
 * A reducer that responds to changes in the current selection.
 *
 * When the selection is changed, this reducer resolves styles for all nodes and changes that
 * have either become part of the selection or have been removed from the selection.
 */
const selectionChanged = (state: StylesState, action: PayloadAction<SelectionUpdate>) => {

    const { nodes, edges } = action.payload;

    if (nodes) {
        nodes.updatedIDs.forEach((nodeID, i) => {
            const hovered = nodes.updatedHoverStates[i];
            const selected = nodes.updatedSelectionStates[i];
            state.nodeStyles[nodeID] = resolveNodeStyle(state, nodeID, hovered, selected);
        });
    }

    if (edges) {
        edges.updatedIDs.forEach((edgeID, i) => {
            const hovered = edges.updatedHoverStates[i];
            const selected = edges.updatedSelectionStates[i];
            state.edgeStyles[edgeID] = resolveEdgeStyle(state, edgeID, hovered, selected);
        });
    }

};

/**
 * A reducer that responds to changes in the waypoint styles.
 *
 * When the waypoint styles are updated, this reducer simply sets them in the styles slice.
 */
const waypointStyleChanged = (state: StylesState, action: PayloadAction<DynamicStyles>) => {
    state.waypoint = action.payload;
};

const reducers = {
    edgeStyleDefaultsChanged,
    edgeStyleDefsChanged,
    nodeStyleDefaultsChanged,
    nodeStyleDefsChanged,
    waypointStyleChanged
};

const extraReducers = {
    graphChanged,
    selectionChanged
};

export { reducers, extraReducers }