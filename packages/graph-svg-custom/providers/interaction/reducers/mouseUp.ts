import { MouseEvent } from 'react';
import { InteractionState } from '../useInteractionState';

export type MouseUp = {
  type: 'mouseup';
  event: MouseEvent;
};

function mouseUp(event: MouseEvent): MouseUp {
  return {
    type: 'mouseup',
    event
  };
}

function handleMouseUp(
  state: InteractionState,
  action: MouseUp
): InteractionState {
  return {
    ...state,
    isDragging: false,
    isPanning: false,
    offsets: {},
    selection: []
  };
}

export { mouseUp, handleMouseUp };
