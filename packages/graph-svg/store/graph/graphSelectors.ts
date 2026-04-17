import { Edge, Graph, PositionedNode } from '@graph-ts/graph-lib';
import { GraphState } from './graph';

export const getGraph = <N extends PositionedNode, E extends Edge> (state: GraphState<N, E>): Graph<N, E> =>
    state.graph;

export const getEdge = <N extends PositionedNode, E extends Edge> (state: GraphState<N, E>, edgeID: string) =>
    state.graph.edges[edgeID];
export const getEdgeIDs = <N extends PositionedNode, E extends Edge> (state: GraphState<N, E>) =>
    state.edgeIDs;
export const getNode = <N extends PositionedNode, E extends Edge> (state: GraphState<N, E>, nodeID: string) =>
    state.graph.nodes[nodeID];
export const getNodeIDs = <N extends PositionedNode, E extends Edge> (state: GraphState<N, E>) =>
    state.nodeIDs;
export const getSpreadMatrix = <N extends PositionedNode, E extends Edge> (state: GraphState<N, E>) =>
    state.spreadMatrix;

export const getEdgeSourceID = <N extends PositionedNode, E extends Edge> (state: GraphState<N, E>, edgeID: string) =>
    getEdge(state, edgeID).source;
export const getEdgeTargetID = <N extends PositionedNode, E extends Edge> (state: GraphState<N, E>, edgeID: string) =>
    getEdge(state, edgeID).target;
export const getEdgeSource = <N extends PositionedNode, E extends Edge> (state: GraphState<N, E>, edgeID: string) =>
    getNode(state, getEdgeSourceID(state, edgeID));
export const getEdgeTarget = <N extends PositionedNode, E extends Edge> (state: GraphState<N, E>, edgeID: string) =>
    getNode(state, getEdgeTargetID(state, edgeID));