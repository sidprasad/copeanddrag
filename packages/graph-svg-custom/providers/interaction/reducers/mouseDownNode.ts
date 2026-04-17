import { MouseEvent } from 'react';
import { InteractionState } from '../useInteractionState';

export type MouseDownNode = {
  type: 'mousedownnode';
  event: MouseEvent;
  nodeId: string;
};

function mouseDownNode(nodeId: string, event: MouseEvent): MouseDownNode {
  return {
    type: 'mousedownnode',
    nodeId,
    event
  };
}

function handleMouseDownNode(
  state: InteractionState,
  action: MouseDownNode
): InteractionState {
  const { event, nodeId } = action;
  event.preventDefault();
  event.stopPropagation();
  state.selection.push(nodeId);
  state.isDragging = true;
  return state;
}

export { mouseDownNode, handleMouseDownNode };
