import { useSterlingSelector } from '../../../state/hooks';
import { selectGraphDrawer } from '../../../state/selectors';
import {
  EvaluatorDrawer,
  EvaluatorDrawerHeader
} from '../common/EvaluatorDrawer/EvaluatorDrawer';
import { LogDrawer, LogDrawerHeader } from '../common/LogDrawer';
import {
  GraphStateDrawer,
  GraphStateDrawerHeader
} from './state/GraphStateDrawer';
import {
  GraphProjectionsDrawer,
  GraphProjectionsDrawerHeader
} from './projections/GraphProjectionsDrawer';
import {
  ExplorerDrawer,
  ExplorerDrawerHeader
} from '../common/explorer/ExplorerDrawer';
import { GraphLayoutDrawer, GraphLayoutDrawerHeader } from './theme/GraphLayoutDrawer';
import { SynthesisDrawer, SynthesisDrawerHeader } from './synthesis';

const GraphDrawer = () => {
  const drawer = useSterlingSelector(selectGraphDrawer);
  return (
    <>
      {drawer === 'explorer' && <ExplorerDrawer />}
      {drawer === 'state' && <GraphStateDrawer />}
      {drawer === 'projections' && <GraphProjectionsDrawer />}
      {drawer === 'evaluator' && <EvaluatorDrawer />}
      {drawer === 'log' && <LogDrawer />}
      {drawer === 'layout' && <GraphLayoutDrawer />}
      {drawer === 'synthesis' && <SynthesisDrawer />}
    </>
  );
};

// state drawer = time
// projections drawer = projection controls
// explorer = select instance
// theme = theme

const GraphDrawerHeader = () => {
  const drawer = useSterlingSelector(selectGraphDrawer);
  return (
    <>
      {drawer === 'explorer' && <ExplorerDrawerHeader />}
      {drawer === 'state' && <GraphStateDrawerHeader />}
      {drawer === 'projections' && <GraphProjectionsDrawerHeader />}
      {drawer === 'evaluator' && <EvaluatorDrawerHeader />}
      {drawer === 'log' && <LogDrawerHeader />}
      {drawer === 'layout' && <GraphLayoutDrawerHeader />}
      {drawer === 'synthesis' && <SynthesisDrawerHeader />}
    </>
  );
};

export { GraphDrawer, GraphDrawerHeader };
