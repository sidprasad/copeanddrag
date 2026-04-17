import { Edge, PositionedNode } from '@graph-ts/graph-lib';
import { Vector2 } from '@graph-ts/vector2';
import { createSlice } from '@reduxjs/toolkit';
import { createGraphState, GraphState } from './graph';
import { reducers } from './graphReducers';

export type NodePositionUpdate = {
    nodeIDs: string[]
    offset: Vector2
}

const initialState: GraphState<PositionedNode, Edge> = createGraphState();

const graphSlice = createSlice({
    name: 'graph',
    initialState,
    reducers
});

export const {
    graphChanged,
    nodesOffset,
    spreadMatrixChanged
} = graphSlice.actions;
export default graphSlice.reducer;
