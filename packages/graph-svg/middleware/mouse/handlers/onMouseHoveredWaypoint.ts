import { selectionChanged } from '../../../store/selection/selectionSlice';
import { AppDispatch, RootState } from '../../../store/store';
import { Gesture } from '../gesture';
import { hoverNothing, hoverWaypoint } from '../selection';

/**
 * The mouse has entered or left a waypoint
 * @param state The current state
 * @param next The dispatcher function
 * @param waypointID The waypoint that caused the event to be triggered
 * @param hoverID The newly hovered waypoint ID, or null if no waypoint is hovered
 */
const onMouseHoveredWaypointHandler = (gesture: Gesture) => {
    return (state: RootState, next: AppDispatch, waypointID: string, hoverID: string | null) => {

        if (!gesture.isDragging()) {

            hoverID
                ? next(selectionChanged(hoverWaypoint(state, hoverID)))
                : next(selectionChanged(hoverNothing(state)));

        }

    }
};

export default onMouseHoveredWaypointHandler;