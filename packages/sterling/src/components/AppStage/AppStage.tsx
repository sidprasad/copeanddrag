import { Pane } from '@/sterling-ui';
import { useSterlingSelector } from '../../state/hooks';
import { selectMainView } from '../../state/selectors';
import { GraphView } from '../GraphView/GraphView';
import { ScriptView } from '../ScriptView/ScriptView';
import { TableView } from '../TableView/TableView';
import { EditView } from '../EditView/EditView';

const AppStage = () => {
  const mainView = useSterlingSelector(selectMainView);
  return (
    <Pane>
      {mainView === 'GraphView' && <GraphView />}
      {mainView === 'TableView' && <TableView />}
      {mainView === 'ScriptView' && <ScriptView />}
      {mainView === 'EditView' && <EditView />}
    </Pane>
  );
};

export { AppStage };
