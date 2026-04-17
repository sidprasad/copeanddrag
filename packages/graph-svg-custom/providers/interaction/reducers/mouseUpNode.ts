import { MouseEvent } from 'react';
import { InteractionState } from '../useInteractionState';

export type MouseUpNode = {
  type: 'mouseupnode';
  event: MouseEvent;
  nodeId: string;
};

function mouseUpNode(nodeId: string, event: MouseEvent): MouseUpNode {
  return {
    type: 'mouseupnode',
    event,
    nodeId
  };
}

function handleMouseUpNode(
  state: InteractionState,
  action: MouseUpNode
): InteractionState {
  const { event } = action;
  event.preventDefault();
  event.stopPropagation();
  state.isDragging = false;
  state.isPanning = false;
  state.offsets = {};
  state.selection = [];
  return state;
}

export { mouseUpNode, handleMouseUpNode };
