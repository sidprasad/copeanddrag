import { defaultTo } from 'lodash-es';
import { useCallback } from 'react';
import { WithInteractionCallbacks } from './interactionCallbacks';
import { ClickNode, handleClickNode } from './reducers/clickNode';
import { handleMouseDown, MouseDown } from './reducers/mouseDown';
import { handleMouseDownNode, MouseDownNode } from './reducers/mouseDownNode';
import { handleMouseMove, MouseMove } from './reducers/mouseMove';
import { handleMouseUp, MouseUp } from './reducers/mouseUp';
import { handleMouseUpNode, MouseUpNode } from './reducers/mouseUpNode';
import { handleWheel, Wheel } from './reducers/wheel';
import { InteractionState } from './useInteractionState';

const unhandled = () => false;

function useInteractionReducer(svg: SVGSVGElement | null) {
  return useCallback(
    (
      state: InteractionState,
      action: WithInteractionCallbacks<Interaction>
    ): InteractionState => {
      let cb,
        callbacks = action.callbacks;
      switch (action.type) {
        case 'clicknode':
          cb = defaultTo(callbacks?.onClickNode, unhandled);
          return cb(action.nodeId, action.event)
            ? state
            : handleClickNode(state, action);
        case 'mousedown':
          cb = defaultTo(callbacks?.onMouseDown, unhandled);
          return cb(action.event) ? state : handleMouseDown(state, action);
        case 'mousedownnode':
          cb = defaultTo(callbacks?.onMouseDownNode, unhandled);
          return cb(action.nodeId, action.event)
            ? state
            : handleMouseDownNode(state, action);
        case 'mousemove':
          cb = defaultTo(callbacks?.onMouseMove, unhandled);
          return cb(action.event) ? state : handleMouseMove(state, action, svg);
        case 'mouseup':
          cb = defaultTo(callbacks?.onMouseUp, unhandled);
          return cb(action.event) ? state : handleMouseUp(state, action);
        case 'mouseupnode':
          cb = defaultTo(callbacks?.onMouseUpNode, unhandled);
          if (cb(action.nodeId, action.event)) return state;
          cb = defaultTo(callbacks?.onSelectionMoved, unhandled);
          if (cb(state.offsets)) return state;
          return handleMouseUpNode(state, action);
        case 'wheel':
          cb = defaultTo(callbacks?.onWheel, unhandled);
          if (cb(action.event)) return state;
          const oldSpread = state.spreadMatrix;
          const oldZoom = state.zoomMatrix;
          const next = handleWheel(state, action, svg);
          cb = defaultTo(callbacks?.onSpreadChanged, unhandled);
          if (oldSpread !== next.spreadMatrix) {
            if (cb(next.spreadMatrix)) return state;
          }
          cb = defaultTo(callbacks?.onZoomChanged, unhandled);
          if (oldZoom !== next.zoomMatrix) {
            if (cb(next.zoomMatrix)) return state;
          }
          return next;
      }
      return state;
    },
    [svg]
  );
}

export type Interaction =
  | ClickNode
  | MouseDown
  | MouseDownNode
  | MouseMove
  | MouseUp
  | MouseUpNode
  | Wheel;

export { useInteractionReducer };
