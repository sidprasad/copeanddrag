import { selectionChanged } from '../../../store/selection/selectionSlice';
import { AppDispatch, RootState } from '../../../store/store';
import { Gesture } from '../gesture';
import { hoverNode, hoverNothing } from '../selection';

/**
 * The mouse has entered or left a node. The nodeID parameter is the node that fired the event, the
 * hoverID parameter is the new hover target.
 */
const onMouseHoveredNodeHandler = (gesture: Gesture) => {
    return (state: RootState, next: AppDispatch, nodeID: string, hoverID: string | null) => {

        if (!gesture.isDragging()) {

            hoverID
                ? next(selectionChanged(hoverNode(state, hoverID)))
                : next(selectionChanged(hoverNothing(state)))
        }

    }
};

export default onMouseHoveredNodeHandler;