import { WheelEvent } from 'react';
import { applyToPoint, inverse, scale, transform } from 'transformation-matrix';
import { ZOOM_SCALE_FACTOR } from '../../zoom/constants';
import { InteractionState } from '../useInteractionState';

/**
 * An action that contains a mouse wheel event.
 */
export type Wheel = {
  type: 'wheel';
  event: WheelEvent;
};

/**
 * Create a Wheel action.
 */
function wheel(event: WheelEvent): Wheel {
  return {
    type: 'wheel',
    event
  };
}

/**
 * Reducer function that uses a wheel event to generate the next state. Regular
 * scrolling will perform a zoom and scrolling with the shift key pressed will
 * perform a spread.
 */
function handleWheel(
  state: InteractionState,
  action: Wheel,
  svg: SVGSVGElement | null
): InteractionState {
  const event = action.event;
  const sf = getScaleFactor(event);

  if (svg && sf !== 0 && !event.ctrlKey) {
    return event.shiftKey
      ? handleSpread(state, event, sf, svg)
      : handleZoom(state, event, sf, svg);
  }

  return state;
}

/**
 * Reducer function that performs a spread.
 */
function handleSpread(
  state: InteractionState,
  event: WheelEvent,
  sf: number,
  svg: SVGSVGElement
): InteractionState {
  const ctm = svg.getScreenCTM();
  if (ctm) {
    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const coords = pt.matrixTransform(ctm.inverse());
    const { x, y } = applyToPoint(
      transform(inverse(state.spreadMatrix), inverse(state.zoomMatrix)),
      coords
    );
    const spreadMatrix = transform(state.spreadMatrix, scale(sf, sf, x, y));
    return {
      ...state,
      spreadMatrix
    };
  }
  return state;
}

/**
 * Reducer function that performs a zoom.
 */
function handleZoom(
  state: InteractionState,
  event: WheelEvent,
  sf: number,
  svg: SVGSVGElement
): InteractionState {
  const ctm = svg.getScreenCTM();
  if (ctm) {
    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const coords = pt.matrixTransform(ctm.inverse());
    const { x, y } = applyToPoint(inverse(state.zoomMatrix), coords);
    const zoomMatrix = transform(state.zoomMatrix, scale(sf, sf, x, y));
    return {
      ...state,
      zoomMatrix
    };
  }
  return state;
}

/**
 * Extract the zoom scale factor from a wheel event. A scale factor of zero
 * indicates that no zooming has occurred.
 */
function getScaleFactor(event: WheelEvent): number {
  const dd = event.shiftKey ? event.deltaX : event.deltaY;
  if (dd === 0) return 0;
  return dd < 0 ? ZOOM_SCALE_FACTOR : 1 / ZOOM_SCALE_FACTOR;
}

export { handleWheel, wheel };
