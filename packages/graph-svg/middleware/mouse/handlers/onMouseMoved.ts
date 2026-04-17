import { dragOffsetChanged } from '../../../store/selection/selectionSlice';
import { AppDispatch, areDraggablesSelected, RootState } from '../../../store/store';
import { DragDispatcher } from '../drag';
import { Gesture } from '../gesture';
import { ZoomTransformSetter } from '../middleware';

/**
 * The mouse has been moved, check for dragging.
 */
const onMouseMovedHandler = (gesture: Gesture, dragDispatch: DragDispatcher, setZoomTransform: ZoomTransformSetter) => {
    return (state: RootState, next: AppDispatch, event: MouseEvent) => {

        if (gesture.isDragging()) {
            if (areDraggablesSelected(state))
                dragDispatch(next, dragOffsetChanged(gesture.dragOffset(event)));
            else
                setZoomTransform(gesture.translate(event));
        }

    }
};

export default onMouseMovedHandler;