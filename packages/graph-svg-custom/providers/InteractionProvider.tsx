import { Vector2 } from '@/vector2';
import {
  createContext,
  ReactNode,
  useContext,
  MouseEvent,
  useCallback
} from 'react';

export interface InteractionContext {
  getNodeOffset: (nodeId: string) => Vector2;
  onClickNode: (nodeId: string) => void;
  onMouseDownNode: (nodeId: string, event: MouseEvent<SVGGElement>) => void;
  onMouseMoveNode: (nodeId: string, event: MouseEvent<SVGGElement>) => void;
  onMouseUpNode: (nodeId: string, event: MouseEvent<SVGGElement>) => void;
}

const interactionContext = createContext<InteractionContext>(
  defaultInteractionContext()
);

const useInteractions = () => {
  return useContext(interactionContext);
};

const NO_OFFSET: Vector2 = { x: 0, y: 0 };

const useInteractionState = (
  onClickNode?: (nodeId: string) => void
): InteractionContext => {
  const getNodeOffset = (nodeId: string): Vector2 => {
    return NO_OFFSET;
  };

  const handleClickNode = (nodeId: string) => {
    if (onClickNode) onClickNode(nodeId);
  };

  const handleMouseDownNode = useCallback(
    (nodeId: string, event: MouseEvent<SVGGElement>) => {
      console.log('down', nodeId);
    },
    []
  );

  const handleMouseMoveNode = useCallback(
    (nodeId: string, event: MouseEvent<SVGGElement>) => {
      console.log(event.movementX, event.movementY);
    },
    []
  );

  const handleMouseUpNode = useCallback(
    (nodeId: string, event: MouseEvent<SVGGElement>) => {
      console.log('up', nodeId);
    },
    []
  );

  return {
    getNodeOffset,
    onClickNode: handleClickNode,
    onMouseDownNode: handleMouseDownNode,
    onMouseMoveNode: handleMouseMoveNode,
    onMouseUpNode: handleMouseUpNode
  };
};

const InteractionProvider = ({
  children,
  onClickNode
}: {
  children?: ReactNode;
  onClickNode?: (nodeId: string) => void;
}) => {
  const interactionState = useInteractionState(onClickNode);
  return (
    <interactionContext.Provider value={interactionState}>
      {children}
    </interactionContext.Provider>
  );
};

function defaultInteractionContext(): InteractionContext {
  return {
    getNodeOffset: () => NO_OFFSET,
    onClickNode: () => {},
    onMouseDownNode: () => {},
    onMouseMoveNode: () => {},
    onMouseUpNode: () => {}
  };
}

export { InteractionProvider, useInteractions };
