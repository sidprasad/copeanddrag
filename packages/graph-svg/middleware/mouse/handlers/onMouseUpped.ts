import { nodesOffset } from '../../../store/graph/graphSlice';
import { waypointsOffset } from '../../../store/paths/pathsSlice';
import { dragOffsetChanged } from '../../../store/selection/selectionSlice';
import { AppDispatch, getSelectedNodeIDs, getSelectedWaypointIDs, RootState } from '../../../store/store';
import { DragDispatcher } from '../drag';
import { Gesture } from '../gesture';

/**
 * A mouse button has been released. Cancel any pending drag dispatches.
 */
const onMouseUppedHandler = (
    gesture: Gesture,
    dragDispatch: DragDispatcher) => {

    return (state: RootState, next: AppDispatch, event: MouseEvent) => {

        // Cancel any pending drag dispatches
        dragDispatch.cancel();

        if (gesture.isDragging()) {

            // End the drag
            const offset = gesture.dragEnd(event);

            // Reset the drag offset
            next(dragOffsetChanged({
                x: 0,
                y: 0
            }));

            // Apply the drag offset to the selection if it's nonzero
            if (offset.x !== 0 || offset.y !== 0) {
                next(nodesOffset({
                    nodeIDs: getSelectedNodeIDs(state),
                    offset: offset
                }));
                next(waypointsOffset({
                    waypointIDs: getSelectedWaypointIDs(state),
                    offset: offset
                }));
            }

        }

    };

};

export default onMouseUppedHandler;