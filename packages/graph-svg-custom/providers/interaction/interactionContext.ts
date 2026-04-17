import { Vector2 } from '@/vector2';
import { createContext, MouseEvent, WheelEvent } from 'react';
import { identity, Matrix } from 'transformation-matrix';

export interface InteractionContext {
  nodeOffset: (nodeId: string) => Vector2;
  onClickNode: (nodeId: string, event: MouseEvent) => void;
  onMouseDown: (event: MouseEvent) => void;
  onMouseDownNode: (nodeId: string, event: MouseEvent) => void;
  onMouseMove: (event: MouseEvent) => void;
  onMouseUp: (event: MouseEvent) => void;
  onMouseUpNode: (nodeId: string, event: MouseEvent) => void;
  onWheel: (event: WheelEvent) => void;
  spreadMatrix: Matrix;
  zoomMatrix: Matrix;
}

/**
 * A React context for mouse click and drag interactions, initialized with
 * no-ops and identities.
 */
const interactionContext = createContext<InteractionContext>({
  nodeOffset: () => ({ x: 0, y: 0 }),
  onClickNode: () => {},
  onMouseDown: () => {},
  onMouseDownNode: () => {},
  onMouseMove: () => {},
  onMouseUp: () => {},
  onMouseUpNode: () => {},
  onWheel: () => {},
  spreadMatrix: identity(),
  zoomMatrix: identity()
});

export { interactionContext };
