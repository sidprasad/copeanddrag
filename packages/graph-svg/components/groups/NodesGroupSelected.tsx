import { FC, memo } from 'react';
import { useSelector } from 'react-redux';
import NodeGroup from './NodeGroup';
import { BoundNodeIDs } from '../types';
import { getDragOffset } from '../../store/store';

type NodesGroupsSelectedProps = BoundNodeIDs;

const NodesGroupSelected: FC<NodesGroupsSelectedProps> = props => {

    const dragOffset = useSelector(getDragOffset);

    return <g
        className={'selected'}
        transform={`translate(${dragOffset.x} ${dragOffset.y})`}>
        {
            props.nodeIDs.map((id: string) => {
                return <NodeGroup
                    key={id}
                    nodeID={id}
                    selected={true}/>
            })
        }
    </g>

};

export default memo(NodesGroupSelected);