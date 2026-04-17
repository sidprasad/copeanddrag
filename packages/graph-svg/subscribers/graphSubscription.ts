import { EnhancedStore, Unsubscribe } from '@reduxjs/toolkit';
import { Edge, PositionedNode } from '@graph-ts/graph-lib';
import { GraphGroupProps, GraphUpdateCallback } from '../GraphGroupProps';
import { getGraph, RootState } from '../store/store';

function graphSubscription <N extends PositionedNode, E extends Edge> (store: EnhancedStore<RootState>, props: GraphGroupProps<N, E>, unsubscribe?: Unsubscribe): Unsubscribe {

    if (unsubscribe) unsubscribe();

    const state = store.getState();
    let graph = getGraph(state);
    const onGraphDidUpdate: GraphUpdateCallback | undefined = props.onGraphDidUpdate;

    const listener = () => {

        if (onGraphDidUpdate) {

            const state = store.getState();
            const _graph = getGraph(state);
            if (_graph !== graph) {
                graph = _graph;
                onGraphDidUpdate(graph);
            }

        }

    };

    return store.subscribe(listener);

}

export { graphSubscription };