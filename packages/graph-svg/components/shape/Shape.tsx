import { FC, memo } from 'react';
import { useSelector } from 'react-redux';
import { getNodeStyle, getShape, RootState } from '../../store/store';
import { BoundNodeID } from '../types';
import Circle from './circle/Circle';
import Rectangle from './rectangle/Rectangle';

const Shape: FC<BoundNodeID> = props => {

    const { nodeID } = props;
    const shape = useSelector((state: RootState) => getShape(state, nodeID));
    const style = useSelector((state: RootState) => getNodeStyle(state, nodeID));

    switch (shape.shape) {
        case 'circle':
            return <Circle style={style} {...shape}/>
        case 'rectangle':
            return <Rectangle style={style} {...shape}/>
    }

    return null;

}

export default memo(Shape);