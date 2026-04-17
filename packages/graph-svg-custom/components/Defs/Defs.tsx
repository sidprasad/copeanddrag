import { ArrowDef } from '@/graph-svg';
import { ArrowHead } from '../ArrowHead/ArrowHead';

interface DefsProps {
  arrowHeads: ArrowDef[];
}

const Defs = (props: DefsProps) => {
  const { arrowHeads } = props;
  return (
    <defs>
      {arrowHeads.map((arrow, index) => {
        return <ArrowHead key={index} {...arrow} />;
      })}
    </defs>
  );
};

export { Defs };
