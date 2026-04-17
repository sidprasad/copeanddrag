import { every } from 'lodash-es';
import { selectionChanged } from '../../../store/selection/selectionSlice';
import { AppDispatch, getEdge, RootState } from '../../../store/store';
import { Gesture } from '../gesture';
import { selectEdges, selectNodes, toggleEdges, toggleNodes } from '../selection';
import { getNodeSelectionStatus } from '../utilities';

/**
 * TODO: Update these docs
 * A mouse button has been downed on an edge. If shift key is pressed, toggle incident
 * nodes. Otherwise, if incident both incident nodes are not selected, make them the
 * node selection.
 */
const onMouseDownedEdgeHandler = (gesture: Gesture) => {
    return (state: RootState, next: AppDispatch, edgeID: string, event: MouseEvent) => {

        // Check that it was the primary mouse button
        if (event.button === 0) {

            // If the alt key is pressed, we're selecting incident nodes
            if (event.altKey) {

                // Start the drag
                gesture.dragStart(event);

                // Get the edge and its two incident nodes and determine if they are in the current selection
                const edge = getEdge(state, edgeID);
                const incidentNodes = [edge.source, edge.target];
                const incidentNodesSelected = getNodeSelectionStatus(state, incidentNodes);

                // If the shift key is pressed, we're toggling. Otherwise if at least one of the incident
                // nodes is not selected, then we're setting the node selection to be the incident nodes.
                if (event.shiftKey) {

                    next(selectionChanged(toggleNodes(state, incidentNodes)));


                } else if (!every(incidentNodesSelected)) {

                    next(selectionChanged(selectNodes(state, incidentNodes)));

                }

            }

            // otherwise we're selecting/toggling the edge
            else {

                if (event.shiftKey)
                    next(selectionChanged(toggleEdges(state, [edgeID])));
                else
                    next(selectionChanged(selectEdges(state, [edgeID])));

            }

        }

    }

};

export default onMouseDownedEdgeHandler;