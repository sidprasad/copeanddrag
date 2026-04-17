import { values } from 'lodash-es';
import { FC, memo, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getPorts, RootState } from '../../store/store';
import Port from '../port/Port';
import { BoundNodeID, PortDef } from '../types';

const PortsGroup: FC<BoundNodeID> = props => {

    const { nodeID } = props;

    // Use the selector to retrieve the node shape
    const portsSet = useSelector((state: RootState) => getPorts(state, nodeID));

    // Get the ports as an array
    const ports = useMemo(() => values(portsSet), [portsSet]);

    return <g className={'ports'}>
        {
            ports.map((port: PortDef, i: number) => <Port key={i} {...port}/>)
        }
    </g>

}

export default memo(PortsGroup);