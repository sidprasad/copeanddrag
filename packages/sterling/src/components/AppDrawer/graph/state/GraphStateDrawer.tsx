import { PaneTitle } from '@/sterling-ui';
import { useSterlingSelector } from '../../../../state/hooks';
import {
  selectActiveDatum,
  selectDatumIsTrace,
  selectPresentationMode
} from '../../../../state/selectors';
import { TimeSection } from './time/TimeSection';
import { TemporalPolicySection } from './temporal/TemporalPolicySection';
import { PresentationModeSelect } from './time/PresentationModeSelect';
import { ComparisonLayoutToggle } from './time/ComparisonLayoutToggle';

const GraphStateDrawer = () => {
  const activeDatum = useSterlingSelector(selectActiveDatum);
  const isTrace = useSterlingSelector((state) =>
    activeDatum ? selectDatumIsTrace(state, activeDatum) : false
  );
  const mode = useSterlingSelector((state) =>
    activeDatum ? selectPresentationMode(state, activeDatum) : 'single'
  );

  if (!activeDatum) return null;

  // The pane-flow toggle only matters when multiple states are shown.
  const showLayoutToggle = isTrace && (mode === 'window' || mode === 'compare');

  return (
    <div className='absolute inset-0 flex flex-col overflow-y-auto'>
      {/* Compact controls row: policy + presentation mode (+ pane flow when
          multiple states are shown), all on one line to save vertical space. */}
      <div className='flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-rule px-3 py-2'>
        <TemporalPolicySection datum={activeDatum} />
        {isTrace && <PresentationModeSelect datum={activeDatum} />}
        {showLayoutToggle && <ComparisonLayoutToggle datum={activeDatum} />}
      </div>

      {isTrace ? (
        <TimeSection datum={activeDatum} />
      ) : (
        <div className='p-4 text-sm text-ink-muted'>
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
