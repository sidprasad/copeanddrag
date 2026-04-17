import { Vector2 } from '@/vector2';
import { useCallback, WheelEvent } from 'react';
import {
  applyToPoint,
  inverse,
  Matrix,
  scale,
  transform
} from 'transformation-matrix';
import { SPREAD_SCALE_FACTOR } from './constants';

const useSpreadHandler = (
  spreadMatrix: Matrix,
  zoomMatrix: Matrix,
  toSVGCoordinates: (x: number, y: number) => Vector2,
  callback: (matrix: Matrix) => void
) =>
  useCallback(
    (event: WheelEvent) => {      
      if (event.deltaX === 0) return;
      const sf =
        event.deltaX < 0 ? SPREAD_SCALE_FACTOR : 1 / SPREAD_SCALE_FACTOR;
      const { x, y } = applyToPoint(
        transform(inverse(spreadMatrix), inverse(zoomMatrix)),
        toSVGCoordinates(event.clientX, event.clientY)
      );
      const newSpread = transform(spreadMatrix, scale(sf, sf, x, y));
      callback(newSpread);
    },
    [spreadMatrix, toSVGCoordinates, callback]
  );

export { useSpreadHandler };
