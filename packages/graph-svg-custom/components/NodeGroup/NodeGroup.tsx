import { NodeDef } from '@/graph-svg';
import { add } from '@/vector2';
import { memo, useMemo } from 'react';
import { applyToPoint } from 'transformation-matrix';
import { useInteraction } from '../../providers/interaction/InteractionProvider';
import { NodeLabel } from '../NodeLabel/NodeLabel';
import { Shape } from '../Shape/Shape';

const NodeGroup = memo((props: NodeDef) => {
  const { id, position, shape, style, labels, superscripts } = props;
  const {
    onClickNode,
    onMouseDownNode,
    onMouseUpNode,
    spreadMatrix,
    nodeOffset
  } = useInteraction();

  const offset = nodeOffset(id);
  const translate = useMemo(() => {
    const transformed = add(applyToPoint(spreadMatrix, position), offset);

    return `translate(${transformed.x} ${transformed.y})`;
  }, [position, offset, spreadMatrix]);

  return (
    <g
      id={id}
      transform={translate}
      onClick={(event) => onClickNode(id, event)}
      onMouseDown={(event) => onMouseDownNode(id, event)}
      onMouseUp={(event) => onMouseUpNode(id, event)}
    >
      <Shape shape={shape} style={style} />
      {labels && <NodeLabel label={labels} />}
      {superscripts && <NodeLabel label={superscripts} />}
    </g>
  );
});

export { NodeGroup };
