import { Vector2 } from '@/vector2';
import { useCallback } from 'react';
import { applyToPoint, inverse, Matrix } from 'transformation-matrix';

interface TransformationFn {
  (x: number, y: number): Vector2;
}

/**
 * A React hook that returns two transformation functions. The first converts
 * to SVG coordinates and the second converts to local coordinates.
 */
const useTransformations = (
  svg: SVGSVGElement | null,
  zoomMatrix: Matrix
): [TransformationFn, TransformationFn] => {
  const toSVGCoordinates = useCallback(
    (x: number, y: number) => {
      if (svg) {
        const pt = svg.createSVGPoint();
        const ctm = svg.getScreenCTM();
        if (ctm) {
          pt.x = x;
          pt.y = y;
          return pt.matrixTransform(ctm.inverse());
        }
      }
      return { x, y };
    },
    [svg]
  );

  const toLocalCoordinates = useCallback(
    (x: number, y: number) => {
      return applyToPoint(inverse(zoomMatrix), toSVGCoordinates(x, y));
    },
    [zoomMatrix, toSVGCoordinates]
  );

  return [toSVGCoordinates, toLocalCoordinates];
};

export { useTransformations };
