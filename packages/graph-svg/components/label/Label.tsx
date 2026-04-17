import { Vector2 } from '@graph-ts/vector2';
import { FC, memo } from 'react';
import { LabelDef } from '../types';

type LabelProps = LabelDef & Partial<Vector2>;

const Label: FC<LabelProps> = props => {

    return <text
        x={props.x}
        y={props.y}
        style={props.style}
        {...props.props}>
        {props.text}
    </text>

}

export default memo(Label);