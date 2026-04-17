import { useSterlingSelector } from '../../state/hooks';
import { selectActiveDatum } from '../../state/selectors';
import { ScriptViewDatum } from './ScriptViewDatum';

const ScriptView = () => {
  const datum = useSterlingSelector(selectActiveDatum);
  if (!datum) return null;
  return <ScriptViewDatum datum={datum} data-testid='script-view-datum'/>;
};

export { ScriptView };
