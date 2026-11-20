import { Pane } from '@/sterling-ui';
import { useSterlingSelector } from '../../state/hooks';
import { selectActiveDatum, selectMainView } from '../../state/selectors';
import { GraphView } from '../GraphView/GraphView';
import { ScriptView } from '../ScriptView/ScriptView';
import { TableView } from '../TableView/TableView';
import { EditView } from '../EditView/EditView';
import { NearMissPanel } from '../GraphView/NearMissPanel';

const AppStage = () => {
  const mainView = useSterlingSelector(selectMainView);
  const datum = useSterlingSelector(selectActiveDatum);
  const diagnostic = datum?.nearMiss || datum?.nearMissOptions;
  return (
    <Pane display="flex" flexDirection="column">
      {datum && diagnostic && <NearMissPanel key={datum.id} datum={datum} />}
      {(!diagnostic || datum?.nearMiss?.violations) && (
        <div className="relative flex-1 min-h-0">
          {mainView === 'GraphView' && <GraphView />}
          {mainView === 'TableView' && <TableView />}
          {mainView === 'ScriptView' && <ScriptView />}
          {mainView === 'EditView' && <EditView />}
        </div>
      )}
    </Pane>
  );
};

export { AppStage };
