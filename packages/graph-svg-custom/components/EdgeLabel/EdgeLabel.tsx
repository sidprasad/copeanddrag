import { EdgeLabelDef } from '../../types';
import { Label } from '../Label/Label';

interface EdgeLabelProps {
  label: EdgeLabelDef[];
  position: DOMPoint[];
}

const EdgeLabel = (props: EdgeLabelProps) => {
  const { label, position } = props;

  if (label.length !== position.length) return null;

  return (
    <>
      {label.map((def, index) => {
        const { x, y } = position[index];
        return <Label key={index} x={x} y={y} {...def} />;
      })}
    </>
  );
};

export { EdgeLabel };
