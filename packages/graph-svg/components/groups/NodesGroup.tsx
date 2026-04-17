import { FC, memo } from 'react';
import { useSelector } from 'react-redux';
import { getPartitionedNodeIDs } from '../../selectors/getPartitionedNodeIDs';
import NodeGroup from './NodeGroup';
import NodesGroupSelected from './NodesGroupSelected';

const NodesGroup: FC = () => {

    const [nodeIDs, selectedNodeIDs] = useSelector(getPartitionedNodeIDs);

    return <g className={'nodes'}>
        {
            nodeIDs.map(nodeID => {
                return <NodeGroup
                    key={nodeID}
                    nodeID={nodeID}
                    selected={false}/>
            })
        }
        <NodesGroupSelected nodeIDs={selectedNodeIDs}/>
    </g>
}

export default memo(NodesGroup);