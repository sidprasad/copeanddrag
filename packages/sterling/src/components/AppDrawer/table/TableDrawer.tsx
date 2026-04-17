import { useSterlingSelector } from '../../../state/hooks';
import { selectTableDrawer } from '../../../state/selectors';
import {
  EvaluatorDrawer,
  EvaluatorDrawerHeader
} from '../common/EvaluatorDrawer/EvaluatorDrawer';
import { LogDrawer, LogDrawerHeader } from '../common/LogDrawer';
import { TableStateDrawer, TableStateDrawerHeader } from './TableStateDrawer';
import {
  ExplorerDrawer,
  ExplorerDrawerHeader
} from '../common/explorer/ExplorerDrawer';
import { GiConsoleController } from 'react-icons/gi';

const TableDrawer = () => {
  console.log("table drawer explorer!")
  const drawer = useSterlingSelector(selectTableDrawer);
  return (
    <>
      {drawer === 'explorer' && <ExplorerDrawer />} 
      {drawer === 'state' && <TableStateDrawer />}
      {drawer === 'evaluator' && <EvaluatorDrawer />}
      {drawer === 'log' && <LogDrawer />}
    </>
  );
};

const TableDrawerHeader = () => {
  const drawer = useSterlingSelector(selectTableDrawer);
  return (
    <>
      {drawer === 'explorer' && <ExplorerDrawerHeader />}
      {drawer === 'state' && <TableStateDrawerHeader />}
      {drawer === 'evaluator' && <EvaluatorDrawerHeader />}
      {drawer === 'log' && <LogDrawerHeader />}
    </>
  );
};

export { TableDrawer, TableDrawerHeader };
