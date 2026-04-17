import { useCallback, useState } from 'react';
import { EdgeDef } from '../../types';
import { EdgeLabel } from '../EdgeLabel/EdgeLabel';
import { Path } from '../Path/Path';
import { positionLabel } from './positionLabel';

const EdgeGroup = (props: EdgeDef) => {
  const { id, path, curve, style, labels } = props;

  const [labelPositions, setLabelPositions] = useState<DOMPoint[]>([]);

  const onPathRender = useCallback(
    (path: SVGPathElement) => {
      if (labels)
        setLabelPositions(labels.map((label) => positionLabel(label, path)));
    },
    [setLabelPositions, labels]
  );

  return (
    <g id={`${id}`}>
      <Path path={path} curve={curve} style={style} onRender={onPathRender} />
      {labels && <EdgeLabel label={labels} position={labelPositions} />}
    </g>
  );
};

export { EdgeGroup };
