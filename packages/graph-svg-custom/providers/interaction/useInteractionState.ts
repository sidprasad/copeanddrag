import { Vector2 } from '@/vector2';
import { MouseEvent, useCallback, useReducer, WheelEvent } from 'react';
import { identity, Matrix } from 'transformation-matrix';
import { withInteractionCallbacks } from './interactionCallbacks';
import { InteractionContext } from './interactionContext';
import { InteractionProviderProps } from './InteractionProvider';
import { Interaction, useInteractionReducer } from './interactionReducer';
import { clickNode } from './reducers/clickNode';
import { mouseDown } from './reducers/mouseDown';
import { mouseDownNode } from './reducers/mouseDownNode';
import { mouseMove } from './reducers/mouseMove';
import { mouseUp } from './reducers/mouseUp';
import { mouseUpNode } from './reducers/mouseUpNode';
import { wheel } from './reducers/wheel';

export interface InteractionState {
  isDragging: boolean;
  isPanning: boolean;
  offsets: Record<string, Vector2>;
  selection: string[];
  spreadMatrix: Matrix;
  zoomMatrix: Matrix;
}

function defaultInteractionState(): InteractionState {
  return {
    isDragging: false,
    isPanning: false,
    offsets: {},
    selection: [],
    spreadMatrix: identity(),
    zoomMatrix: identity()
  };
}

const useInteractionState = (
  props: InteractionProviderProps
): InteractionContext => {
  const { svg, ...callbacks } = props;

  // Create the interaction reducer.
  const reducer = useInteractionReducer(svg);

  // Create the internal state, which is updated using the interaction reducer.
  const [state, dispatch] = useReducer(reducer, defaultInteractionState());

  // Create a callback we can use to enhance our actions with callbacks
  const dispatchWithCallbacks = useCallback(
    (action: Interaction) => {
      dispatch(withInteractionCallbacks(action, callbacks));
    },
    [dispatch, callbacks]
  );

  // Create all callbacks that are provided by the context
  const nodeOffset = useCallback(
    (nodeId: string): Vector2 => {
      return state.offsets[nodeId] || { x: 0, y: 0 };
    },
    [state.offsets]
  );

  const onClickNode = useCallback(
    (nodeId: string, event: MouseEvent) =>
      dispatchWithCallbacks(clickNode(nodeId, event)),
    [dispatchWithCallbacks]
  );

  const onMouseDown = useCallback(
    (event: MouseEvent) => dispatchWithCallbacks(mouseDown(event)),
    [dispatchWithCallbacks]
  );

  const onMouseDownNode = useCallback(
    (nodeId: string, event: MouseEvent) =>
      dispatchWithCallbacks(mouseDownNode(nodeId, event)),
    [dispatchWithCallbacks]
  );

  const onMouseMove = useCallback(
    (event: MouseEvent) => dispatchWithCallbacks(mouseMove(event)),
    [dispatchWithCallbacks]
  );

  const onMouseUp = useCallback(
    (event: MouseEvent) => dispatchWithCallbacks(mouseUp(event)),
    [dispatchWithCallbacks]
  );

  const onMouseUpNode = useCallback(
    (nodeId: string, event: MouseEvent) =>
      dispatchWithCallbacks(mouseUpNode(nodeId, event)),
    [dispatchWithCallbacks]
  );

  const onWheel = useCallback(
    (event: WheelEvent) => dispatchWithCallbacks(wheel(event)),
    [dispatchWithCallbacks]
  );

  return {
    nodeOffset,
    onClickNode,
    onMouseDown,
    onMouseDownNode,
    onMouseMove,
    onMouseUp,
    onMouseUpNode,
    onWheel,
    spreadMatrix: state.spreadMatrix,
    zoomMatrix: state.zoomMatrix
  };
};

export { useInteractionState };
