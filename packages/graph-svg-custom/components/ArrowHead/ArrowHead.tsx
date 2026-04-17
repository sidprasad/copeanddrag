import { ArrowDef } from '@/graph-svg';
import { memo } from 'react';
import { arrowheadId } from './arrowheadId';

const ArrowHead = memo((props: ArrowDef) => {
  const { size, color } = props;
  const id = arrowheadId(size, color);
  const half = size / 2;
  return (
    <marker
      id={id}
      viewBox={`0 0 ${size} ${size}`}
      refX={0}
      refY={half}
      markerWidth={size}
      markerHeight={size}
      markerUnits={'userSpaceOnUse'}
      orient={'auto'}
      fill={color}
    >
      <path d={`M 0 0 L ${size} ${half} L 0 ${size} z`} />
    </marker>
  );
});

export { ArrowHead };
