import { Vector2 } from '@graph-ts/vector2';
import { FC, memo, useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { mouseDownedWaypoint, mouseEnteredWaypoint, mouseLeftWaypoint } from '../../middleware/mouse/middleware';
import { getWaypointStyles } from '../../store/store';
import { BoundWaypointID } from '../types';
import { createWaypointStyle } from './waypointUtils';

type WaypointProps = BoundWaypointID & {
    waypoint: Vector2
    selected: boolean
}

const Waypoint: FC<WaypointProps> = props => {

    const { waypointID, waypoint, selected } = props;

    const dispatch = useDispatch();

    const [hovered, setHovered] = useState<boolean>(false);

    const styles = useSelector(getWaypointStyles);
    const style = useMemo(() => createWaypointStyle(styles, selected, hovered), [styles, selected, hovered]);

    const onMouseDown = useCallback((event: React.MouseEvent) => {
        event.stopPropagation();
        dispatch(mouseDownedWaypoint({
            waypointID,
            event: event.nativeEvent
        }))
    }, [dispatch]);

    const onMouseEnter = useCallback((event: React.MouseEvent) => {
        setHovered(true);
        event.stopPropagation();
        dispatch(mouseEnteredWaypoint({
            waypointID,
            event: event.nativeEvent
        }))
    }, [dispatch]);

    const onMouseLeave = useCallback((event: React.MouseEvent) => {
        setHovered(false);
        dispatch(mouseLeftWaypoint({
            waypointID,
            event: event.nativeEvent
        }))
    }, [dispatch]);

    return <circle
        cx={waypoint.x}
        cy={waypoint.y}
        r={3}
        style={style}
        onMouseDown={onMouseDown}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
    />

}

export default memo(Waypoint);