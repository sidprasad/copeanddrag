import { subtract, Vector2 } from '@/vector2';
import { useCallback, MouseEvent } from 'react';
import { Matrix, transform, translate } from 'transformation-matrix';

const useDragHandler = (
  zoomMatrix: Matrix,
  toLocalCoordinates: (x: number, y: number) => Vector2,
  isDragging: boolean,
  callback: (matrix: Matrix) => void
) =>
  useCallback(
    (event: MouseEvent) => {
      if (isDragging) {
        // Get the point and distance travelled in local coordinates
        const point = toLocalCoordinates(event.clientX, event.clientY);
        const offset = toLocalCoordinates(
          event.clientX + event.movementX,
          event.clientY + event.movementY
        );

        // Calculate the difference
        const { x, y } = subtract(offset, point);

        // Apply the difference to the zoom matrix
        const newZoomMatrix = transform([zoomMatrix, translate(x, y)]);

        // Call the callback with the new matrix
        callback(newZoomMatrix);
      }
    },
    [zoomMatrix, toLocalCoordinates, isDragging, callback]
  );

export { useDragHandler };
