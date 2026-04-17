import { memo } from 'react';
import { EdgeDef } from '../../types';
import { EdgeGroup } from '../EdgeGroup/EdgeGroup';

interface EdgesGroupProps {
  edges: EdgeDef[];
}

const EdgesGroup = memo((props: EdgesGroupProps) => {
  const { edges } = props;
  return (
    <g className='edges'>
      {edges.map((edge) => (
        <EdgeGroup key={edge.id} {...edge} />
      ))}
    </g>
  );
});

export { EdgesGroup };
