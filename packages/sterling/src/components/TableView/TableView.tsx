import { Pane, PaneBody, PaneHeader } from '@/sterling-ui';
import { useSterlingSelector } from '../../state/hooks';
import { selectActiveDatum } from '../../state/selectors';
import { TableViewDatum } from './TableViewDatum';
import { TableViewHeader } from './TableViewHeader';

const TableView = () => {
  const datum = useSterlingSelector(selectActiveDatum);

  if (!datum) return null;
  return (
    <Pane>
      <PaneHeader>
        <TableViewHeader datum={datum} />
      </PaneHeader>
      <PaneBody>
        <div className='w-full h-full flex content-start items-start flex-wrap overflow-y-auto'>
          <TableViewDatum datum={datum} />
        </div>
      </PaneBody>
    </Pane>
  );
};

export { TableView };
