import { Vector2 } from '@/vector2';
import { LabelDef } from '../../types';

type LabelProps = Vector2 & LabelDef;

const Label = (props: LabelProps) => {
  return (
    <text x={props.x} y={props.y} style={props.style} {...props.props}>
      {props.text}
    </text>
  );
};

export { Label };
