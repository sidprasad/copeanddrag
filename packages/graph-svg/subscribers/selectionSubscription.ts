import { EnhancedStore, Unsubscribe } from '@reduxjs/toolkit';
import { Edge, PositionedNode } from '@graph-ts/graph-lib';
import { GraphGroupProps, HoverUpdateCallback, SelectionUpdateCallback } from '../GraphGroupProps';
import { getHoveredEdgeID, getHoveredNodeID, getSelectedEdgeIDs, getSelectedNodeIDs, RootState } from '../store/store';

function selectionSubscription <N extends PositionedNode, E extends Edge> (store: EnhancedStore<RootState>, props: GraphGroupProps<N, E>, unsubscribe?: Unsubscribe): Unsubscribe {

    if (unsubscribe) unsubscribe();

    const state = store.getState();
    let hoveredNodeID: string | null = getHoveredNodeID(state);
    let hoveredEdgeID: string | null = getHoveredEdgeID(state);
    let selectedNodeIDs: string[] = getSelectedNodeIDs(state);
    let selectedEdgeIDs: string[] = getSelectedEdgeIDs(state);

    const onNodeHovered: HoverUpdateCallback | undefined = props.onNodeHovered;
    const onEdgeHovered: HoverUpdateCallback | undefined = props.onEdgeHovered;
    const onSelectionDidUpdate: SelectionUpdateCallback | undefined = props.onSelectionDidUpdate;

    const listener = () => {

        const state = store.getState();

        if (onNodeHovered) {
            const _hoveredNodeID: string | null = getHoveredNodeID(state);
            if (_hoveredNodeID !== hoveredNodeID) {
                hoveredNodeID = _hoveredNodeID;
                onNodeHovered(hoveredNodeID);
            }
        }

        if (onEdgeHovered) {
            const _hoveredEdgeID: string | null = getHoveredEdgeID(state);
            if (_hoveredEdgeID !== hoveredEdgeID) {
                hoveredEdgeID = _hoveredEdgeID;
                onEdgeHovered(hoveredEdgeID);
            }
        }

        if (onSelectionDidUpdate) {
            const _selectedNodeIDs: string[] = getSelectedNodeIDs(state);
            const _selectedEdgeIDs: string[] = getSelectedEdgeIDs(state);
            if (_selectedNodeIDs !== selectedNodeIDs || _selectedEdgeIDs !== selectedEdgeIDs) {
                selectedNodeIDs = _selectedNodeIDs;
                selectedEdgeIDs = _selectedEdgeIDs;
                onSelectionDidUpdate(selectedNodeIDs, selectedEdgeIDs);
            }
        }

    };

    return store.subscribe(listener);

}

export { selectionSubscription }