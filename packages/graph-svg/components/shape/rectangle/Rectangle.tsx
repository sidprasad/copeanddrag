import { FC, memo } from 'react';
import { RectangleDef, Styled } from '../../types';

type RectangleProps = RectangleDef & Styled;

/**
 * A styled rectangle centered on a node location.
 */
const Rectangle: FC<RectangleProps> = props => {

    const {width, height, style} = props;

    const _width = +width;
    const _height = +height;

    return <rect
        x={-_width / 2}
        y={-_height / 2}
        width={_width}
        height={_height}
        style={style}/>

}

export default memo(Rectangle);