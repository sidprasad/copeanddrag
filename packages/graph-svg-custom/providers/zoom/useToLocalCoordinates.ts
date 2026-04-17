import { useCallback } from 'react';
import { applyToPoint, inverse, Matrix } from 'transformation-matrix';
import { Vector2 } from '@/vector2';

/**
 * React hook to create a memoized callback function that converts from SVG
 * element coordinates to local coordinates.
 *
 * @param zoomMatrix The current zoom matrix
 * @param toSVGCoordinates A function to convert from SVG element to SVG coordinates
 */
const useToLocalCoordinates = (
  zoomMatrix: Matrix,
  toSVGCoordinates: (x: number, y: number) => Vector2
) =>
  useCallback(
    (x: number, y: number) => {
      return applyToPoint(inverse(zoomMatrix), toSVGCoordinates(x, y));
    },
    [zoomMatrix, toSVGCoordinates]
  );

export { useToLocalCoordinates };
