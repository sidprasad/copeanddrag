import { Button, DatumParsed } from '@/sterling-connection';
import { GraphViewHeaderButton } from './GraphViewHeaderButton';

interface GraphViewHeaderProps {
  datum: DatumParsed<any>;
}

// The instance ID and command now live in the top nav bar (see NavDatumInfo);
// this header only carries the provider's action buttons, and is rendered by
// GraphView only when there are buttons to show.
const GraphViewHeader = (props: GraphViewHeaderProps) => {
  const { datum } = props;
  const { id, buttons, generatorName } = datum;

  return (
    <div className='w-full flex items-center space-x-2 px-2'>
      <div className='grow' />
      {buttons &&
        buttons.map((button: Button, index: number) => {
          return (
            <GraphViewHeaderButton key={index} datumId={id} generatorId={generatorName} button={button} />
          );
        })}
    </div>
  );
};

export { GraphViewHeader };
