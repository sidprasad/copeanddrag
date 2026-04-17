import { FC, memo } from 'react';
import { CircleDef, Styled } from '../../types';

type CircleProps = CircleDef & Styled;

/**
 * A styled circle centered on a node location.
 */
const Circle: FC<CircleProps> = props => {

    const {radius, style} = props;

    return <circle
        r={radius}
        style={style}/>

};

export default memo(Circle);