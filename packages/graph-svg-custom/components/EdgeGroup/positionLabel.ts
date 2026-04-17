import { clamp } from 'lodash-es';
import { EdgeLabelDef } from '../../types';

export function positionLabel(
  label: EdgeLabelDef,
  path: SVGPathElement
): DOMPoint {
  // Get the total length of the path
  const length = path.getTotalLength();

  // If position is not defined, default to the center of the path
  if (label.position === undefined) return path.getPointAtLength(length / 2);

  // If the position is a number, it's the percent distance along the path
  if (typeof label.position === 'number') {
    const pct = clamp(label.position, 0, 1);
    return path.getPointAtLength(pct * length);
  }

  // Otherwise it's an absolute distance in pixels from one of the ends
  const distance = clamp(label.position.distance, 0, length);
  return label.position.from === 'source'
    ? path.getPointAtLength(distance)
    : path.getPointAtLength(length - distance);
}
