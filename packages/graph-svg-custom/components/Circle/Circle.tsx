import { CircleDef } from '@/graph-svg';
import { CSSProperties, memo } from 'react';

interface CircleProps {
  shape: CircleDef;
  style: CSSProperties;
}

const Circle = memo((props: CircleProps) => {
  const { shape, style } = props;
  return <circle r={shape.radius} style={style} />;
});

export { Circle };
