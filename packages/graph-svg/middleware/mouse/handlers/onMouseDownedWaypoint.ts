import { selectionChanged } from '../../../store/selection/selectionSlice';
import { AppDispatch, RootState } from '../../../store/store';
import { Gesture } from '../gesture';
import { selectWaypoints, toggleWaypoints } from '../selection';
import { getWaypointSelectionStatus } from '../utilities';

/**
 * A mouse button has been downed on a waypoint. If shift key is pressed, toggle the waypoint.
 * Otherwise, if the waypoint is not selected, set it as the current selection.
 */
export const onMouseDownedWaypointHandler = (gesture: Gesture) => {
    return (state: RootState, next: AppDispatch, waypointID: string, event: MouseEvent) => {

        // Check that it was the primary mouse button
        if (event.button === 0) {

            // Start the drag
            gesture.dragStart(event);

            // Get the selection status of the waypoint that was downed
            const selectionStatus = getWaypointSelectionStatus(state, [waypointID]);

            // If the shift key is pressed, toggle the waypoint. Otherwise if it's not alreay
            // selected, make it the current selection.
            if (event.shiftKey) {

                next(selectionChanged(toggleWaypoints(state, [waypointID])));

            } else if (!selectionStatus[0]) {

                next(selectionChanged(selectWaypoints(state, [waypointID])));

            }

        }

    }
};

export default onMouseDownedWaypointHandler;