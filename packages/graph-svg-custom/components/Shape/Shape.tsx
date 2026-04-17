import { ShapeDef } from '@/graph-svg';
import { CSSProperties, memo } from 'react';
import { Circle } from '../Circle/Circle';
import { Rectangle } from '../Rectangle/Rectangle';

interface ShapeProps {
  shape: ShapeDef;
  style: CSSProperties;
}

const Shape = memo((props: ShapeProps) => {
  const { shape, style } = props;
  switch (shape.shape) {
    case 'circle':
      return <Circle shape={shape} style={style} />;
    case 'rectangle':
      return <Rectangle shape={shape} style={style} />;
  }
  return null;
});

export { Shape };
