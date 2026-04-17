import { Button, DatumParsed } from '@/sterling-connection';
import { PaneTitle } from '@/sterling-ui';
import { ViewHeaderButton } from '../common/ViewHeaderButton';

interface TableViewHeaderProps {
  datum: DatumParsed<any>;
}

const TableViewHeader = (props: TableViewHeaderProps) => {
  const { datum } = props;
  const { id, parsed, buttons } = datum;
  const command = parsed.command;
  return (
    <div className='w-full flex items-center space-x-2 px-2'>
      <PaneTitle className='text-gray-400'>ID: {id}</PaneTitle>
      <PaneTitle>{command}</PaneTitle>
      <div className='grow' />
      {buttons &&
        buttons.map((button: Button, index: number) => {
          return <ViewHeaderButton key={index} datumId={id} generatorId={datum.generatorName} button={button} />;
        })}
    </div>
  );
};

export { TableViewHeader };
