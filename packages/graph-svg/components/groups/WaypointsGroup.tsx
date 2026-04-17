import { Vector2 } from '@graph-ts/vector2';
import { FC, memo } from 'react';
import { useSelector } from 'react-redux';
import { getWaypointsResolved } from '../../selectors/getWaypointsResolved';
import { getWaypointsSelectionStatus } from '../../selectors/getWaypointsSelectionStatus';
import { RootState } from '../../store/store';
import { BoundEdgeID } from '../types';
import Waypoint from '../waypoint/Waypoint';
import { createWaypointID } from '../waypoint/waypointUtils';

const WaypointsGroup: FC<BoundEdgeID> = props => {

    const { edgeID } = props;

    const waypoints = useSelector((state: RootState) => getWaypointsResolved(state, edgeID));
    const selected = useSelector((state: RootState) => getWaypointsSelectionStatus(state, edgeID));

    // If there are no waypoints, return nothing
    if (!waypoints || waypoints.length === 0) return null;

    return <g className={'waypoints'}>
        {
            waypoints.map((waypoint: Vector2, index: number) =>
                <Waypoint
                    key={index}
                    waypointID={createWaypointID(edgeID, index)}
                    waypoint={waypoint}
                    selected={selected[index]}/>
            )
        }
    </g>

};

export default memo(WaypointsGroup);