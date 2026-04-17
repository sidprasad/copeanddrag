import { getEdges, getNodes, Graph } from '@graph-ts/graph-lib';
import { defaultTo, merge } from 'lodash-es';
import { CSSProperties } from 'react';
import * as defaults from '../../components/defaults';
import { Dict, DynamicStyles } from '../../components/types';
import { SelectionState } from '../selection/selection';
import {
    getDefaultEdgeStyle,
    getDefaultNodeStyle,
    getEdgeStyleDef,
    getEdgeStyleHoveredDef,
    getEdgeStyleSelectedDef,
    getNodeStyleDef,
    getNodeStyleHoveredDef,
    getNodeStyleSelectedDef
} from './stylesSelectors';

export interface StylesState {

    // Style definitions
    nodeDefs: {
        style: Dict<CSSProperties>
        hovered: Dict<CSSProperties>
        selected: Dict<CSSProperties>
    }

    edgeDefs: {
        style: Dict<CSSProperties>
        hovered: Dict<CSSProperties>
        selected: Dict<CSSProperties>
    }

    // Resolved styles
    nodeStyles: Dict<CSSProperties>
    edgeStyles: Dict<CSSProperties>

    // Default styles
    nodeDefault: DynamicStyles
    edgeDefault: DynamicStyles

    // Common styles
    waypoint: DynamicStyles

}

export interface StyleDefUpdate {
    style: Dict<CSSProperties>
    hovered: Dict<CSSProperties>
    selected: Dict<CSSProperties>
    selectionState: SelectionState
}

export interface DefaultStyleDefUpdate {
    style?: CSSProperties
    hovered?: CSSProperties
    selected?: CSSProperties
    selectionState: SelectionState
}

export const createStylesState = (
    graph?: Graph,
    nodeStyles?: Dict<CSSProperties>,
    nodeStylesHovered?: Dict<CSSProperties>,
    nodeStylesSelected?: Dict<CSSProperties>,
    edgeStyles?: Dict<CSSProperties>,
    edgeStylesHovered?: Dict<CSSProperties>,
    edgeStylesSelected?: Dict<CSSProperties>,
    defaultNodeStyle?: Partial<DynamicStyles>,
    defaultEdgeStyle?: Partial<DynamicStyles>,
    waypointStyle?: Partial<DynamicStyles>
): StylesState => {

    const state: StylesState = {
        nodeDefs: {
            style: defaultTo(nodeStyles, {}),
            hovered: defaultTo(nodeStylesHovered, {}),
            selected: defaultTo(nodeStylesSelected, {})
        },
        edgeDefs: {
            style: defaultTo(edgeStyles, {}),
            hovered: defaultTo(edgeStylesHovered, {}),
            selected: defaultTo(edgeStylesSelected, {})
        },
        nodeStyles: {},
        edgeStyles: {},
        nodeDefault: {
            style: defaultTo(defaultNodeStyle?.style, defaults.NODE_STYLE),
            hovered: defaultTo(defaultNodeStyle?.hovered, defaults.NODE_HOVER_STYLE),
            selected: defaultTo(defaultNodeStyle?.selected, defaults.NODE_SELECTED_STYLE)
        },
        edgeDefault: {
            style: defaultTo(defaultEdgeStyle?.style, defaults.EDGE_STYLE),
            hovered: defaultTo(defaultEdgeStyle?.hovered, defaults.EDGE_HOVER_STYLE),
            selected: defaultTo(defaultEdgeStyle?.selected, defaults.EDGE_SELECTED_STYLE)
        },
        waypoint: {
            style: defaultTo(waypointStyle?.style, defaults.WAYPOINT_STYLE),
            hovered: defaultTo(waypointStyle?.hovered, defaults.WAYPOINT_HOVER_STYLE),
            selected: defaultTo(waypointStyle?.selected, defaults.WAYPOINT_SELECTED_STYLE)
        }
    };

    if (graph) {
        getNodes(graph).forEach(node =>
            state.nodeStyles[node.id] = resolveNodeStyle(state, node.id, false, false));
        getEdges(graph).forEach(edge =>
            state.edgeStyles[edge.id] = resolveEdgeStyle(state, edge.id, false, false));
    }

    return state;
}

export function resolveEdgeStyle (state: StylesState, edgeID: string, hovered: boolean, selected: boolean): CSSProperties {
    const defaultStyle = getDefaultEdgeStyle(state);
    const style = defaultTo(getEdgeStyleDef(state, edgeID), defaultStyle.style);
    const hoveredStyle = hovered
        ? defaultTo(getEdgeStyleHoveredDef(state, edgeID), defaultStyle.hovered) : {};
    const selectedStyle = selected
        ? defaultTo(getEdgeStyleSelectedDef(state, edgeID), defaultStyle.selected) : {};
    return merge({}, style, selectedStyle, hoveredStyle);
}

export function resolveNodeStyle (state: StylesState, nodeID: string, hovered: boolean, selected: boolean): CSSProperties {
    const defaultStyle = getDefaultNodeStyle(state);
    const style = defaultTo(getNodeStyleDef(state, nodeID), defaultStyle.style);
    const hoveredStyle = hovered
        ? defaultTo(getNodeStyleHoveredDef(state, nodeID), defaultStyle.hovered) : {};
    const selectedStyle = selected
        ? defaultTo(getNodeStyleSelectedDef(state, nodeID), defaultStyle.selected) : {};
    return merge({}, style, selectedStyle, hoveredStyle);
}