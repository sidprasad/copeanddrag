import { Vector2 } from '@/vector2';
import { MouseEvent, WheelEvent } from 'react';
import { Matrix } from 'transformation-matrix';

/**
 * Interaction callbacks are called in response to user interactions. All
 * callbacks can optionally return a boolean value. If the return value is
 * true, the interaction will be considered "handled" and the default internal
 * behavior will be skipped.
 */
export type InteractionCallbacks = Partial<{
  onClickNode: (nodeId: string, event: MouseEvent) => boolean | void;
  onMouseDown: (event: MouseEvent) => boolean | void;
  onMouseDownNode: (nodeId: string, event: MouseEvent) => boolean | void;
  onMouseMove: (event: MouseEvent) => boolean | void;
  onMouseUp: (event: MouseEvent) => boolean | void;
  onMouseUpNode: (nodeId: string, event: MouseEvent) => boolean | void;
  onSelectionMoved: (offsets: Record<string, Vector2>) => boolean | void;
  onSpreadChanged: (spread: Matrix) => boolean | void;
  onWheel: (event: WheelEvent) => boolean | void;
  onZoomChanged: (zoom: Matrix) => boolean | void;
}>;

export type WithInteractionCallbacks<T> = T & {
  callbacks?: InteractionCallbacks;
};

function withInteractionCallbacks<T>(
  t: T,
  callbacks: InteractionCallbacks
): WithInteractionCallbacks<T> {
  return {
    ...t,
    callbacks
  };
}

export { withInteractionCallbacks };
