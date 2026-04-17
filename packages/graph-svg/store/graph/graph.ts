import { Edge, Graph, newGraph, PositionedNode } from '@graph-ts/graph-lib';
import { defaultTo, keys } from 'lodash-es';
import { identity, Matrix } from 'transformation-matrix';

export type GraphState<N extends PositionedNode, E extends Edge> = {

    graph: Graph<N, E>

    nodeIDs: string[]
    edgeIDs: string[]

    spreadMatrix: Matrix
}

export const createGraphState = <N extends PositionedNode, E extends Edge> (graph?: Graph<N, E>): GraphState<N, E> => {

    const g = defaultTo(graph, newGraph<N, E>());

    return {
        graph: g,
        nodeIDs: keys(g.nodes),
        edgeIDs: keys(g.edges),
        spreadMatrix: identity()
    }

}
