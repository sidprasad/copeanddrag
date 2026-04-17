import { PaneTitle } from '@/sterling-ui';
import { useSterlingSelector } from '../../../../state/hooks';
import { selectActiveDatum, selectDatumIsTrace } from '../../../../state/selectors';
import { TimeSection } from './time/TimeSection';
import { TemporalPolicySection } from './temporal/TemporalPolicySection';

const GraphStateDrawer = () => {
  const activeDatum = useSterlingSelector(selectActiveDatum);
  const isTrace = useSterlingSelector((state) =>
    activeDatum ? selectDatumIsTrace(state, activeDatum) : false
  );

  if (!activeDatum) return null;
  
  return (
    <div className='absolute inset-0 flex flex-col overflow-y-auto'>
      {/* Temporal policy selector — always visible */}
      <TemporalPolicySection datum={activeDatum} />

      {isTrace ? (
        <TimeSection datum={activeDatum} />
      ) : (
        <div className='p-4 text-sm text-gray-500'>
          <p>Time controls are only available for trace-based instances.</p>
        </div>
      )}
    </div>
  );
};

const GraphStateDrawerHeader = () => {
  return (
    <div className='flex items-center px-2 space-x-2'>
      <PaneTitle>Time</PaneTitle>
    </div>
  );
};

export { GraphStateDrawer, GraphStateDrawerHeader };
