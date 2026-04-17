import { FC, memo, useState } from 'react';
import { PortDef } from '../types';

const Port: FC<PortDef> = props => {
    const { x, y } = props;

    const [hovered, setHovered] = useState<boolean>(false);

    return <circle
        className={'port'}
        cx={x}
        cy={y}
        r={4}
        stroke={hovered ? '#333' : '#333'}
        fill={hovered ? '#333' : 'white'}
        strokeWidth={2}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        cursor={'crosshair'}
    />;
}

export default memo(Port);