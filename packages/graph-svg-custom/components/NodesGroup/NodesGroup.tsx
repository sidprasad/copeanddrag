import { NodeDef } from '@/graph-svg';
import { memo } from 'react';
import { Matrix } from 'transformation-matrix';
import { NodeGroup } from '../NodeGroup/NodeGroup';

interface NodesGroupProps {
  nodes: NodeDef[];
}

const NodesGroup = memo((props: NodesGroupProps) => {
  const { nodes } = props;
  return (
    <g className='nodes'>
      {nodes.map((node) => (
        <NodeGroup key={node.id} {...node} />
      ))}
    </g>
  );
});

export { NodesGroup };
