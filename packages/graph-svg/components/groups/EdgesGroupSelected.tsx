import { FC, memo } from 'react';
import { BoundEdgeIDs } from '../types';
import EdgeGroup from './EdgeGroup';

type EdgesGroupSelectedProps = BoundEdgeIDs;

const EdgesGroupSelected: FC<EdgesGroupSelectedProps> = props => {

    const { edgeIDs } = props;

    return <g className={'selected'}>
        {
            edgeIDs.map((edgeID: string) => {
                return <EdgeGroup
                    key={edgeID}
                    edgeID={edgeID}
                    selected={true}/>
            })
        }
    </g>

};

export default memo(EdgesGroupSelected);