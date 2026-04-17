import { useCallback } from 'react';

/**
 * React hook to create a memoized callback function that converts from the
 * SVG element coordinate system to the SVG coordinate system.
 *
 * @param svg An SVG element
 */
const useToSVGCoordinates = (svg: SVGSVGElement | null) =>
  useCallback(
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

export { useToSVGCoordinates };
