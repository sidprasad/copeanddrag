import { NodeLabelDef } from '@/graph-svg';
import { Label } from '../Label/Label';

interface NodeLabelProps {
  label: NodeLabelDef[];
}

const NodeLabel = (props: NodeLabelProps) => {
  const { label } = props;
  return (
    <>
      {label.map((def, index) => {
        //console.log(`handling node: ${JSON.stringify(def)}`)
        const { offset, ...rest } = def;
        return (
          <Label key={index} x={offset?.x || 0} y={offset?.y || 0} {...rest} />
        );
      })}
    </>
  );
};

export { NodeLabel };
