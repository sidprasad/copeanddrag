import { FC, memo } from 'react';
import { useSelector } from 'react-redux';
import { getNodeLabel, RootState } from '../../store/store';
import { BoundNodeID } from '../types';
import Label from './Label';

const NodeLabel: FC<BoundNodeID> = props => {

    const { nodeID } = props;

    // Use the selector to retrieve the node label
    const labelDefs = useSelector((state: RootState) => getNodeLabel(state, nodeID));

    // Render nothing if there's no label
    if (!labelDefs) return null;

    // Map each label def to a Label component
    return <>{
        labelDefs.map((def, i) =>
            <Label
                key={i}
                {...def}/>
        )
    }</>;
}

export default memo(NodeLabel);