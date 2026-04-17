import { useSterlingSelector } from '../../../state/hooks';
import { selectEditDrawer } from '../../../state/selectors';
import {
  EvaluatorDrawer,
  EvaluatorDrawerHeader
} from '../common/EvaluatorDrawer/EvaluatorDrawer';
import { LogDrawer, LogDrawerHeader } from '../common/LogDrawer';
import {
  GraphStateDrawer,
  GraphStateDrawerHeader
} from '../graph/state/GraphStateDrawer';
import {
  GraphProjectionsDrawer,
  GraphProjectionsDrawerHeader
} from '../graph/projections/GraphProjectionsDrawer';
import {
  ExplorerDrawer,
  ExplorerDrawerHeader
} from '../common/explorer/ExplorerDrawer';
import { GraphLayoutDrawer, GraphLayoutDrawerHeader } from '../graph/theme/GraphLayoutDrawer';

const EditDrawer = () => {
  const drawer = useSterlingSelector(selectEditDrawer);
  return (
    <>
      {drawer === 'explorer' && <ExplorerDrawer />}
      {drawer === 'state' && <GraphStateDrawer />}
      {drawer === 'projections' && <GraphProjectionsDrawer />}
      {drawer === 'evaluator' && <EvaluatorDrawer />}
      {drawer === 'log' && <LogDrawer />}
      {drawer === 'layout' && <GraphLayoutDrawer />}
    </>
  );
};

const EditDrawerHeader = () => {
  const drawer = useSterlingSelector(selectEditDrawer);
  return (
    <>
      {drawer === 'explorer' && <ExplorerDrawerHeader />}
      {drawer === 'state' && <GraphStateDrawerHeader />}
      {drawer === 'projections' && <GraphProjectionsDrawerHeader />}
      {drawer === 'evaluator' && <EvaluatorDrawerHeader />}
      {drawer === 'log' && <LogDrawerHeader />}
      {drawer === 'layout' && <GraphLayoutDrawerHeader />}
    </>
  );
};

export { EditDrawer, EditDrawerHeader };
