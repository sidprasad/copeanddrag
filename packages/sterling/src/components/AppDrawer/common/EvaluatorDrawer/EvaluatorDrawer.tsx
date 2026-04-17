import { PaneTitle } from '@/sterling-ui';
import { useSterlingSelector } from '../../../../state/hooks';
import {
  selectActiveDatum,
  selectDatumIsStateful,
  selectDatumIsStatefulProjected
} from '../../../../state/selectors';
import { EvaluatorExpressions } from './EvaluatorExpressions';
import { EvaluatorInput } from './EvaluatorInput';

const EvaluatorDrawer = () => {
  const datum = useSterlingSelector(selectActiveDatum);
  const isTemporal = useSterlingSelector((state) =>
    datum
      ? selectDatumIsStateful(state, datum) ||
        selectDatumIsStatefulProjected(state, datum)
      : false
  );

  if (!datum) return null;
  return (
    <div className='absolute inset-0 flex flex-col'>
      {isTemporal && <TemporalEvaluatorNotice />}
      <EvaluatorInput datum={datum} />
      <EvaluatorExpressions datum={datum} />
    </div>
  );
};

const TemporalEvaluatorNotice = () => {
  return (
    <div className='mx-2 mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900'>
      Temporal mode: evaluator expressions run with respect to the first
      state, not the currently displayed state.
    </div>
  );
};

const EvaluatorDrawerHeader = () => {
  return (
    <div className='flex items-center px-2 space-x-2'>
      <PaneTitle>Evaluator</PaneTitle>
    </div>
  );
};

export { EvaluatorDrawer, EvaluatorDrawerHeader };
