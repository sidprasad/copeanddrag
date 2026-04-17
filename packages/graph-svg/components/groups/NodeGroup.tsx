import classNames from 'classnames';
import React, { FC, memo, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { applyToPoint } from 'transformation-matrix';
import { mouseDownedNode, mouseEnteredNode, mouseLeftNode } from '../../middleware/mouse/middleware';
import { getHoveredNodeID, getNode, getSpreadMatrix, RootState } from '../../store/store';
import NodeLabel from '../label/NodeLabel';
import Shape from '../shape/Shape';
import { BoundNodeID } from '../types';


type NodeGroupProps = BoundNodeID & {
    selected: boolean
};

const NodeGroup: FC<NodeGroupProps> = props => {

    const { nodeID } = props;

    const dispatch = useDispatch();

    const node = useSelector((state: RootState) => getNode(state, nodeID));
    const hovered = useSelector((state: RootState) => getHoveredNodeID(state) === nodeID);
    const spreadTransform = useSelector(getSpreadMatrix);

    const className = useMemo(() => classNames('node', { hovered }), [hovered]);
    const translate = useMemo(
        () => {
            const transformed = applyToPoint(spreadTransform, node);
            return `translate(${transformed.x} ${transformed.y})`
        },
        [node.x, node.y, spreadTransform]
    )

    const onMouseDown = useCallback((event: React.MouseEvent) => {
        dispatch(mouseDownedNode({
            nodeID: nodeID,
            event: event.nativeEvent
        }));
    }, []);

    const onMouseEnter = useCallback((event: React.MouseEvent) => {
        dispatch(mouseEnteredNode({
            nodeID: nodeID,
            event: event.nativeEvent
        }));
    }, []);

    const onMouseLeave = useCallback((event: React.MouseEvent) => {
        dispatch(mouseLeftNode({
            nodeID: props.nodeID,
            event: event.nativeEvent
        }));
    }, []);

    return <g
        id={nodeID}
        transform={translate}
        className={className}
        onMouseDown={onMouseDown}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}>
        <Shape nodeID={nodeID}/>
        <NodeLabel nodeID={nodeID}/>
    </g>;
}

export default memo(NodeGroup);