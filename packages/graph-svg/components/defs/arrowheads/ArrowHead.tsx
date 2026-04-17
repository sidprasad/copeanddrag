import { FC, memo } from 'react';

export interface ArrowHeadProps {
    id: string
    color: string
    size: number
}

const ArrowHead: FC<ArrowHeadProps> = props => {

    const { id, color, size } = props;
    const half = size / 2;

    return <marker
        id={id}
        viewBox={`0 0 ${size} ${size}`}
        refX={0}
        refY={half}
        markerWidth={size}
        markerHeight={size}
        markerUnits={'userSpaceOnUse'}
        orient={'auto'}
        fill={color}>
        <path d={`M 0 0 L ${size} ${half} L 0 ${size} z`}/>
    </marker>
};

export default memo(ArrowHead);