import { Button, DatumParsed } from '@/sterling-connection';
import { PaneTitle } from '@/sterling-ui';
import { GraphData } from '../../state/graphs/graphs';
import { GraphViewHeaderButton } from './GraphViewHeaderButton';

interface GraphViewHeaderProps {
  datum: DatumParsed<any>;
}

const GraphViewHeader = (props: GraphViewHeaderProps) => {
  const { datum } = props;
  const { id, parsed, buttons, generatorName } = datum;
  const command = parsed.command;

  return (
    <div className='w-full flex item-center space-x-2 px-2'>
      <PaneTitle className='text-gray-400'>ID: {id}</PaneTitle>
      <PaneTitle>{command}</PaneTitle>
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
