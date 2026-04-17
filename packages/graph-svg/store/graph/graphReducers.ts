import { Edge, Graph, offsetNodes, PositionedNode } from '@graph-ts/graph-lib';
import { PayloadAction } from '@reduxjs/toolkit';
import { keys } from 'lodash-es';
import { Matrix } from 'transformation-matrix';
import { GraphState } from './graph';
import { NodePositionUpdate } from './graphSlice';

/**
 * A reducer that responds to changes in the graph.
 *
 * When the graph is changed, this reducer stores a reference to the new graph in
 * the graph slice and extracts the node and edge IDs.
 */
const graphChanged = <N extends PositionedNode, E extends Edge>(state: GraphState<N, E>, action: PayloadAction<Graph<N, E>>) => {
    state.graph = action.payload;
    state.nodeIDs = keys(state.graph.nodes);
    state.edgeIDs = keys(state.graph.edges);
};

/**
 * A reducer that responds to changes in the node offset.
 *
 * When the user finishes moving a selection by dragging, the offset is "committed"
 * to the graph in this reducer by adding the offset to the nodes in the selection.
 * This is in contrast with the offset that occurs during dragging, which is applied
 * to the selection SVG group as a performance optimization.
 */
const nodesOffset = <N extends PositionedNode, E extends Edge> (state: GraphState<N, E>, action: PayloadAction<NodePositionUpdate>) => {
    const { nodeIDs, offset } = action.payload;
    state.graph = offsetNodes(state.graph, nodeIDs, offset);
};

/**
 * A reducer that responds to changes in the spread matrix.
 *
 * This reducer simply sets the spread matrix in the graph slice.
 */
const spreadMatrixChanged = <N extends PositionedNode, E extends Edge> (state: GraphState<N, E>, action: PayloadAction<Matrix>) => {
    state.spreadMatrix = action.payload;
};

const reducers = {
    graphChanged,
    nodesOffset,
    spreadMatrixChanged
};

export { reducers };