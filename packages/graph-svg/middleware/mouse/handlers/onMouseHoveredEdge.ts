import { selectionChanged } from '../../../store/selection/selectionSlice';
import { AppDispatch, RootState } from '../../../store/store';
import { Gesture } from '../gesture';
import { hoverEdge, hoverNothing } from '../selection';

/**
 * The mouse has entered or left an edge. The edgeID parameter is the edge that fired the event, the
 * hoverID parameter is the new hover target.
 */
const onMouseHoveredEdgeHandler = (gesture: Gesture) => {
    return (state: RootState, next: AppDispatch, edgeID: string, hoverID: string | null) => {

        if (!gesture.isDragging()) {

            hoverID
                ? next(selectionChanged(hoverEdge(state, hoverID)))
                : next(selectionChanged(hoverNothing(state)));

        }

    }
};

export default onMouseHoveredEdgeHandler;