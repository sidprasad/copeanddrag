import { DatumParsed } from '@/sterling-connection';
import { useCallback, useState } from 'react';
import type { PresentationMode } from '../../../../../state/graphs/graphs';
import {
  presentationModeSet,
  selectedTimeIndicesSet,
  timeIndexSet,
  timeIndexToggled
} from '../../../../../state/graphs/graphsSlice';
import {
  useSterlingDispatch,
  useSterlingSelector
} from '../../../../../state/hooks';
import {
  selectEffectiveTimeIndices,
  selectLoopbackIndex,
  selectPresentationMode,
  selectSelectedTimeIndices,
  selectTimeIndex,
  selectTraceLength
} from '../../../../../state/selectors';
import { Minimap } from '../../../../Minimap/Minimap';

const MODE_OPTIONS: {
  value: PresentationMode;
  label: string;
  description: string;
}[] = [
  {
    value: 'single',
    label: 'Single State',
    description:
      'Show one state at a time; scrub the timeline to move through the trace.'
  },
  {
    value: 'window',
    label: 'Sliding Window',
    description:
      'Show the state before, the current state, and the state after — side by side.'
  },
  {
    value: 'compare',
    label: 'Compare States',
    description:
      'Click states on the timeline to show any set of them side by side.'
  }
];

// Shared style for the compare-mode quick-select buttons. Theme-aware tokens
// (not Chakra grays) so it tracks light/dark like the rest of the panel.
const HELPER_BUTTON =
  'rounded-md border border-rule bg-surface-sunken px-2 py-1 text-xs font-medium text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink';

const TimePicker = ({ datum }: { datum: DatumParsed<any> }) => {
  const dispatch = useSterlingDispatch();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const mode = useSterlingSelector((state) =>
    selectPresentationMode(state, datum)
  );
  const timeIndex = useSterlingSelector((state) =>
    selectTimeIndex(state, datum)
  );
  const traceLength = useSterlingSelector((state) =>
    selectTraceLength(state, datum)
  );
  const loopBack = useSterlingSelector((state) =>
    selectLoopbackIndex(state, datum)
  );
  // The set of states actually on screen (drives the timeline highlight).
  const effectiveIndices = useSterlingSelector((state) =>
    selectEffectiveTimeIndices(state, datum)
  );
  // The stored compare set (only meaningful in compare mode).
  const compareSet = useSterlingSelector((state) =>
    selectSelectedTimeIndices(state, datum)
  );

  const moveTo = useCallback(
    (index: number) => dispatch(timeIndexSet({ datum, index })),
    [dispatch, datum]
  );

  const toggleAt = useCallback(
    (index: number) => dispatch(timeIndexToggled({ datum, index })),
    [dispatch, datum]
  );

  const changeMode = useCallback(
    (next: PresentationMode) => {
      if (next === mode) return;
      // Entering compare with no prior selection: seed it with the current
      // state so there's something on screen and something to toggle off.
      // A previous compare selection is preserved (we only seed when empty).
      if (next === 'compare' && compareSet.length === 0) {
        dispatch(
          selectedTimeIndicesSet({ datum, selectedIndices: [timeIndex] })
        );
      }
      dispatch(presentationModeSet({ datum, mode: next }));
    },
    [mode, compareSet.length, dispatch, datum, timeIndex]
  );

  const selectFirstLast = useCallback(() => {
    const indices = traceLength > 1 ? [0, traceLength - 1] : [0];
    dispatch(selectedTimeIndicesSet({ datum, selectedIndices: indices }));
  }, [dispatch, datum, traceLength]);

  const selectAll = useCallback(() => {
    const indices = Array.from({ length: traceLength }, (_, i) => i);
    dispatch(selectedTimeIndicesSet({ datum, selectedIndices: indices }));
  }, [dispatch, datum, traceLength]);

  const activeMode = MODE_OPTIONS.find((o) => o.value === mode);

  return (
    <div className='mx-1 my-2 flex flex-col gap-2'>
      {/* Presentation-mode selector */}
      <div>
        <label
          htmlFor='presentation-mode-select'
          className='mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-muted'
        >
          State Presentation
        </label>
        <select
          id='presentation-mode-select'
          value={mode}
          onChange={(e) => changeMode(e.target.value as PresentationMode)}
          className='w-full rounded border border-rule-strong bg-surface px-3 py-2 text-sm shadow-sm focus:border-accent-border focus:outline-none focus:ring-1 focus:ring-accent'
        >
          {MODE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <p className='mt-1 text-xs text-ink-faint'>{activeMode?.description}</p>
      </div>

      {/* Compare-only quick selectors */}
      {mode === 'compare' && (
        <div className='flex items-center gap-1'>
          <span className='mr-1 text-xs text-ink-muted'>Quick select:</span>
          <button
            type='button'
            onClick={selectFirstLast}
            className={HELPER_BUTTON}
          >
            First &amp; Last
          </button>
          <button type='button' onClick={selectAll} className={HELPER_BUTTON}>
            All
          </button>
        </div>
      )}

      {/* Shared timeline. Clicking a circle moves the current state, except in
          compare mode where it toggles the state in/out of the comparison. */}
      <Minimap
        collapsed={isCollapsed}
        current={timeIndex}
        length={traceLength}
        loopBack={loopBack}
        selectedIndices={effectiveIndices}
        label={(index) => `State ${index + 1}/${traceLength}`}
        onChange={moveTo}
        onNodeClick={mode === 'compare' ? toggleAt : moveTo}
        onToggleCollapse={() => setIsCollapsed((collapsed) => !collapsed)}
      />

      {mode === 'compare' && compareSet.length > 1 && (
        <p className='text-xs font-medium text-accent'>
          ✓ {compareSet.length} states selected — showing side-by-side
          comparison
        </p>
      )}
    </div>
  );
};

export { TimePicker };
