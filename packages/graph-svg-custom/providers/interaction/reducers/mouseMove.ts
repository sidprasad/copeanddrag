import { add, subtract, Vector2 } from '@/vector2';
import { MouseEvent } from 'react';
import {
  applyToPoint,
  inverse,
  Matrix,
  transform,
  translate
} from 'transformation-matrix';
import { InteractionState } from '../useInteractionState';

/**
 * An action that contains a mouse move event.
 */
export type MouseMove = {
  type: 'mousemove';
  event: MouseEvent;
};

/**
 * Create a MouseMove action.
 */
function mouseMove(event: MouseEvent): MouseMove {
  return {
    type: 'mousemove',
    event
  };
}

/**
 * Reducer function that generates the next state in response to mouse movement.
 * Will pan the svg if panning flag is true, or will drag the selection if there
 * is one and it's being dragged.
 */
function handleMouseMove(
  state: InteractionState,
  action: MouseMove,
  svg: SVGSVGElement | null
): InteractionState {
  if (svg) {
    if (state.isDragging) {
      return handleDragging(state, action, svg);
    } else if (state.isPanning) {
      return handlePanning(state, action, svg);
    }
  }
  return state;
}

function handlePanning(
  state: InteractionState,
  action: MouseMove,
  svg: SVGSVGElement
): InteractionState {
  const offset = getOffset(action.event, svg, state.zoomMatrix);
  const zoomMatrix = transform([
    state.zoomMatrix,
    translate(offset.x, offset.y)
  ]);
  return {
    ...state,
    zoomMatrix
  };
}

const NO_OFFSET: Vector2 = { x: 0, y: 0 };
function handleDragging(
  state: InteractionState,
  action: MouseMove,
  svg: SVGSVGElement
): InteractionState {
  const selection = state.selection;
  const offsets = { ...state.offsets };
  const offset = getOffset(action.event, svg, state.zoomMatrix);
  selection.forEach((nodeId) => {
    const currentOffset = offsets[nodeId] || NO_OFFSET;
    offsets[nodeId] = add(currentOffset, offset);
  });
  return {
    ...state,
    offsets
  };
}

function getOffset(
  event: MouseEvent,
  svg: SVGSVGElement,
  zoomMatrix: Matrix
): Vector2 {
  const ctm = svg.getScreenCTM();
  if (ctm) {
    const inv = ctm.inverse();
    const invZoom = inverse(zoomMatrix);
    const pt = svg.createSVGPoint();

    pt.x = event.clientX;
    pt.y = event.clientY;
    const coords = applyToPoint(invZoom, pt.matrixTransform(inv));

    pt.x = event.clientX + event.movementX;
    pt.y = event.clientY + event.movementY;
    const offset = applyToPoint(invZoom, pt.matrixTransform(inv));

    return subtract(offset, coords);
  }
  return { x: 0, y: 0 };
}

export { mouseMove, handleMouseMove };
