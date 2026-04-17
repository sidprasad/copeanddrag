import { RectangleDef } from '@/graph-svg';
import { CSSProperties, memo } from 'react';

interface RectangleProps {
  shape: RectangleDef;
  style: CSSProperties;
}

const Rectangle = memo((props: RectangleProps) => {
  const { shape, style } = props;
  return (
    <rect
      x={-shape.width / 2}
      y={-shape.height / 2}
      width={shape.width}
      height={shape.height}
      style={style}
    />
  );
});

export { Rectangle };
