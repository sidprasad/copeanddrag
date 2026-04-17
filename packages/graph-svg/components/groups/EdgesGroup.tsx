import { FC, memo } from 'react';
import { useSelector } from 'react-redux';
import { getPartitionedEdgeIDs } from '../../selectors/getPartitionedEdgeIDs';
import EdgeGroup from './EdgeGroup';
import EdgesGroupSelected from './EdgesGroupSelected';

const EdgesGroup: FC = () => {

    const [unselectedIDs, selectedIDs] = useSelector(getPartitionedEdgeIDs);

    return <g className={'edges'}>
        {
            unselectedIDs.map(id => {
                return <EdgeGroup
                    key={id}
                    edgeID={id}/>
            })
        }
        <EdgesGroupSelected edgeIDs={selectedIDs}/>
    </g>

};

export default memo(EdgesGroup);