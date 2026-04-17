import { MouseEvent } from 'react';
import { InteractionState } from '../useInteractionState';

export type ClickNode = {
  type: 'clicknode';
  event: MouseEvent;
  nodeId: string;
};

function clickNode(nodeId: string, event: MouseEvent): ClickNode {
  return {
    type: 'clicknode',
    nodeId,
    event
  };
}

function handleClickNode(
  state: InteractionState,
  action: ClickNode
): InteractionState {
  return state;
}

export { clickNode, handleClickNode };
