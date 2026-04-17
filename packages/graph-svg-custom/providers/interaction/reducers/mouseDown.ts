import { MouseEvent } from 'react';
import { InteractionState } from '../useInteractionState';

export type MouseDown = {
  type: 'mousedown';
  event: MouseEvent;
};

function mouseDown(event: MouseEvent): MouseDown {
  return {
    type: 'mousedown',
    event
  };
}

function handleMouseDown(
  state: InteractionState,
  action: MouseDown
): InteractionState {
  return {
    ...state,
    isPanning: true
  };
}

export { mouseDown, handleMouseDown };
