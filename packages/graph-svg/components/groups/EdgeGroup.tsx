import classNames from 'classnames';
import React, { FC, memo, useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { mouseDownedEdge, mouseEnteredEdge, mouseLeftEdge } from '../../middleware/mouse/middleware';
import { getEdgeLabel, getHoveredEdgeID, RootState } from '../../store/store';
import EdgeLabel, { resolveEdgeLabelPosition } from '../label/EdgeLabel';
import Path from '../path/Path';
import { BoundEdgeID } from '../types';
import WaypointsGroup from './WaypointsGroup';

export type EdgeGroupProps = BoundEdgeID & {
    selected?: boolean
};

const EdgeGroup: FC<EdgeGroupProps> = props => {

    const { edgeID } = props;

    const dispatch = useDispatch();

    // Boolean indicating if the mouse is hovering the edge
    const hovered = useSelector((state: RootState) =>
        getHoveredEdgeID(state) === edgeID
    );

    // Edge label definitions, which are used to calculate edge label positions
    const labelDefs = useSelector((state: RootState) =>
        getEdgeLabel(state, edgeID)
    );

    // Array of DOMPoints where labels will be placed
    const [labelPositions, setLabelPositions] = useState<DOMPoint[]>();

    // Mouse event callbacks
    const onMouseDown = useCallback((event: React.MouseEvent) => {
        dispatch(mouseDownedEdge({
            edgeID: edgeID,
            event: event.nativeEvent
        }));
    }, []);

    const onMouseEnter = useCallback((event: React.MouseEvent) => {
        dispatch(mouseEnteredEdge({
            edgeID: edgeID,
            event: event.nativeEvent
        }));
    }, []);

    const onMouseLeave = useCallback((event: React.MouseEvent) => {
        dispatch(mouseLeftEdge({
            edgeID: edgeID,
            event: event.nativeEvent
        }));
    }, []);

    // Callback to handle repositioning of edge labels when the path is rerendered
    const onPathRendered = useCallback((path: SVGPathElement) => {
        if (labelDefs) {
            const positions = labelDefs.map(def => resolveEdgeLabelPosition(def, path));
            setLabelPositions(positions);
        }
    }, [labelDefs]);

    const className = useMemo(() => classNames('edge', { hovered }), [hovered]);

    return <g id={edgeID}
              className={className}
              onMouseDown={onMouseDown}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}>
        <Path edgeID={edgeID} onPathRendered={onPathRendered}/>
        { props.selected && <WaypointsGroup edgeID={edgeID}/> }
        <EdgeLabel edgeID={edgeID} labelPositions={labelPositions}/>
    </g>

}

export default memo(EdgeGroup);