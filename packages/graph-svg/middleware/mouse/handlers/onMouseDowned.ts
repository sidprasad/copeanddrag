import { selectionChanged } from '../../../store/selection/selectionSlice';
import {
    AppDispatch,
    getSelectedEdgeIDs,
    getSelectedNodeIDs,
    getSelectedWaypointIDs,
    RootState
} from '../../../store/store';
import { Gesture } from '../gesture';
import { deselectAll } from '../selection';

/**
 * A mouse button has been downed on the background. Clear both all selections.
 */
const onMouseDownedHandler = (gesture: Gesture) => {
    return (state: RootState, next: AppDispatch, event: MouseEvent) => {

        // Set the drag start position
        gesture.dragStart(event);

        // Get the current selection
        const selectedNodeIDs = getSelectedNodeIDs(state);
        const selectedEdgeIDs = getSelectedEdgeIDs(state);
        const selectedWaypointIDs = getSelectedWaypointIDs(state);

        // If there's anything selected, deselect everything
        if (selectedNodeIDs.length || selectedEdgeIDs.length || selectedWaypointIDs.length) {
            next(selectionChanged(deselectAll(state)));
        }
    }
};

export default onMouseDownedHandler;