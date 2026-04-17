import { createAction, Middleware } from '@reduxjs/toolkit';
import { Matrix, toString } from 'transformation-matrix';
import { Edge, PositionedNode } from '../../../../graph-lib';
import { EdgeMouseEvent, NodeMouseEvent, WaypointMouseEvent } from '../../components/types';
import { GraphGroupProps } from '../../GraphGroupProps';
import { RootState } from '../../store/store';
import { makeDragDispatcher } from './drag';
import { Gesture } from './gesture';
import onMouseDownedHandler from './handlers/onMouseDowned';
import onMouseDownedEdgeHandler from './handlers/onMouseDownedEdge';
import onMouseDownedNodeHandler from './handlers/onMouseDownedNode';
import onMouseDownedWaypointHandler from './handlers/onMouseDownedWaypoint';
import onMouseHoveredEdgeHandler from './handlers/onMouseHoveredEdge';
import onMouseHoveredNodeHandler from './handlers/onMouseHoveredNode';
import onMouseHoveredWaypointHandler from './handlers/onMouseHoveredWaypoint';
import onMouseMovedHandler from './handlers/onMouseMoved';
import onMouseUppedHandler from './handlers/onMouseUpped';
import onMouseWheeledHandler from './handlers/onMouseWheeled';
import onSpreadSetHandler from './handlers/onSpreadSet';

export const mouseDowned = createAction<MouseEvent>('mouse/downed');
export const mouseDownedEdge = createAction<EdgeMouseEvent>('mouse/downedEdge');
export const mouseDownedNode = createAction<NodeMouseEvent>('mouse/downedNode');
export const mouseDownedWaypoint = createAction<WaypointMouseEvent>('mouse/downedWaypoint');
export const mouseEnteredEdge = createAction<EdgeMouseEvent>('mouse/enteredEdge');
export const mouseEnteredNode = createAction<NodeMouseEvent>('mouse/enteredNode');
export const mouseEnteredWaypoint = createAction<WaypointMouseEvent>('mouse/enteredWaypoint');
export const mouseLeftEdge = createAction<EdgeMouseEvent>('mouse/leftEdge');
export const mouseLeftNode = createAction<NodeMouseEvent>('mouse/leftNode');
export const mouseLeftWaypoint = createAction<WaypointMouseEvent>('mouse/leftWaypoint');
export const mouseMoved = createAction<MouseEvent>('mouse/moved');
export const mouseUpped = createAction<MouseEvent>('mouse/upped');
export const mouseWheeled = createAction<WheelEvent>('mouse/wheeled');
export const spreadTargetSet = createAction<Matrix>('mouse/spreadTargetSet');

export type MouseMiddleware = Middleware<{}, RootState> & {
    setInteractions: (enabled: boolean) => void
    setZoomElement: (element: SVGElement) => void
    setZoom: (target: Matrix) => void
};

export interface ZoomTransformSetter {
    (matrix: Matrix): void
}

export const mouseMiddleware = <N extends PositionedNode, E extends Edge> (props: GraphGroupProps<N, E>, gesture: Gesture): MouseMiddleware => {

    // Create a function that throttles the dispatching of drag events
    const dragDispatch = makeDragDispatcher();

    // Create a variable that controls whether interactions are enabled
    let interactions = !!props.interactions;

    // Create a variable to hold the element to which the global zoom matrix is applied
    let zoomElement: SVGElement | null = null;

    // Create a function that sets the transformation matrix on the zoom element
    const setZoomTransform: ZoomTransformSetter = (zoomTransform: Matrix) => {
        if (zoomElement)
            zoomElement.setAttribute('transform', toString(zoomTransform));
    };

    // Create the event handlers
    const onMouseDowned = onMouseDownedHandler(gesture);
    const onMouseDownedEdge = onMouseDownedEdgeHandler(gesture);
    const onMouseDownedNode = onMouseDownedNodeHandler(gesture);
    const onMouseDownedWaypoint = onMouseDownedWaypointHandler(gesture);
    const onMouseHoveredEdge = onMouseHoveredEdgeHandler(gesture);
    const onMouseHoveredNode = onMouseHoveredNodeHandler(gesture);
    const onMouseHoveredWaypoint = onMouseHoveredWaypointHandler(gesture);
    const onMouseMoved = onMouseMovedHandler(gesture, dragDispatch, setZoomTransform);
    const onMouseUpped = onMouseUppedHandler(gesture, dragDispatch);
    const onMouseWheeled = onMouseWheeledHandler(gesture, setZoomTransform);
    const onSpreadSet = onSpreadSetHandler(gesture);

    // Create the middleware function
    const middleware: MouseMiddleware = store => next => action => {

        const payload = action.payload;
        const state = store.getState();
        const act = interactions;

        if (mouseMoved.match(action)) act && onMouseMoved(state, next, payload);
        else if (mouseWheeled.match(action)) act && onMouseWheeled(state, next, payload);
        else if (mouseDowned.match(action)) act && onMouseDowned(state, next, payload);
        else if (mouseDownedEdge.match(action)) act && onMouseDownedEdge(state, next, payload.edgeID, payload.event);
        else if (mouseDownedNode.match(action)) act && onMouseDownedNode(state, next, payload.nodeID, payload.event);
        else if (mouseDownedWaypoint.match(action)) act && onMouseDownedWaypoint(state, next, payload.waypointID, payload.event);
        else if (mouseEnteredEdge.match(action)) act && onMouseHoveredEdge(state, next, payload.edgeID, payload.edgeID);
        else if (mouseEnteredNode.match(action)) act && onMouseHoveredNode(state, next, payload.nodeID, payload.nodeID);
        else if (mouseEnteredWaypoint.match(action)) act && onMouseHoveredWaypoint(state, next, payload.waypointID, payload.waypointID);
        else if (mouseLeftEdge.match(action)) act && onMouseHoveredEdge(state, next, payload.edgeID, null);
        else if (mouseLeftNode.match(action)) act && onMouseHoveredNode(state, next, payload.nodeID, null);
        else if (mouseLeftWaypoint.match(action)) act && onMouseHoveredWaypoint(state, next, payload.waypointID, null);
        else if (mouseUpped.match(action)) act && onMouseUpped(state, next, payload);
        else if (spreadTargetSet.match(action)) act && onSpreadSet(state, next, payload);
        else next(action);

    }

    middleware.setInteractions = (enabled: boolean) => {
        interactions = enabled;
    };

    middleware.setZoom = (target: Matrix) => {
        setZoomTransform(gesture.setZoom(target));
    };

    middleware.setZoomElement = (element: SVGElement) => {
        zoomElement = element;
    };

    return middleware;

}