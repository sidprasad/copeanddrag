import { selectionChanged } from '../../../store/selection/selectionSlice';
import { AppDispatch, RootState } from '../../../store/store';
import { Gesture } from '../gesture';
import { selectNodes, toggleNodes } from '../selection';
import { getNodeSelectionStatus } from '../utilities';

/**
 * A mouse button has been downed on a node. If shift key is pressed, toggle the node.
 * Otherwise, if the node is not selected, set it as the current selection.
 */
const onMouseDownedNodeHandler = (gesture: Gesture) => {

    return (state: RootState, next: AppDispatch, nodeID: string, event: MouseEvent) => {

        // Check that it was the primary mouse button
        if (event.button === 0) {

            // Start the drag
            gesture.dragStart(event);

            // Get selection status of node that was downed
            const selectionStatus = getNodeSelectionStatus(state, [nodeID]);
            const isNodeSelected = selectionStatus[0];

            // If the shift key is pressed, toggle the node. Otherwise if it's not already
            // selected, make it the current selection.
            if (event.shiftKey) {

                next(selectionChanged(toggleNodes(state, [nodeID])));

            } else if (!isNodeSelected) {

                next(selectionChanged(selectNodes(state, [nodeID])));

            }

        }

    }
};

export default onMouseDownedNodeHandler;