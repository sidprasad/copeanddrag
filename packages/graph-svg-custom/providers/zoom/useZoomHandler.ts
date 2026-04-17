import { Vector2 } from '@/vector2';
import { useCallback, WheelEvent } from 'react';
import { Matrix, scale, transform } from 'transformation-matrix';
import { ZOOM_SCALE_FACTOR } from './constants';

/**
 * React hook to create a memoized callback that when called with a WheelEvent
 * calculates the new zoom matrix and passes it to the provided callback.
 *
 * @param zoomMatrix The current zoom matrix.
 * @param toLocalCoordinates A function to conver from SVG element to local coordinates.
 * @param callback The function to call with the newly calculated zoom matrix.
 */
const useZoomHandler = (
  zoomMatrix: Matrix,
  toLocalCoordinates: (x: number, y: number) => Vector2,
  callback: (matrix: Matrix) => void
) =>
  useCallback(
    (event: WheelEvent) => {
      if (event.deltaY === 0) return;
      const sf = event.deltaY < 0 ? ZOOM_SCALE_FACTOR : 1 / ZOOM_SCALE_FACTOR;
      const { x, y } = toLocalCoordinates(event.clientX, event.clientY);
      const newZoom = transform(zoomMatrix, scale(sf, sf, x, y));
      callback(newZoom);
    },
    [zoomMatrix, toLocalCoordinates, callback]
  );

export { useZoomHandler };
