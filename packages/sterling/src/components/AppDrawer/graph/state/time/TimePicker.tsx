import { DatumParsed } from '@/sterling-connection';
import { useCallback, useState } from 'react';
import { selectedTimeIndicesSet, timeIndexSet } from '../../../../../state/graphs/graphsSlice';
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

  // Toggle a state in/out of the compare set. We compute the next set and
  // dispatch it wholesale (rather than a toggle action) so the operation is
  // idempotent: React StrictMode invokes the graph's click reducer twice in
  // dev, and a true toggle would flip back to its starting state. Setting the
  // same array twice is a no-op, so the click sticks. Always keep ≥1 selected.
  const toggleAt = useCallback(
    (index: number) => {
      const next = compareSet.includes(index)
        ? compareSet.filter((i) => i !== index)
        : [...compareSet, index].sort((a, b) => a - b);
      dispatch(
        selectedTimeIndicesSet({
          datum,
          selectedIndices: next.length > 0 ? next : compareSet
        })
      );
    },
    [dispatch, datum, compareSet]
  );

  const selectFirstLast = useCallback(() => {
    const indices = traceLength > 1 ? [0, traceLength - 1] : [0];
    dispatch(selectedTimeIndicesSet({ datum, selectedIndices: indices }));
  }, [dispatch, datum, traceLength]);

  const selectAll = useCallback(() => {
    const indices = Array.from({ length: traceLength }, (_, i) => i);
    dispatch(selectedTimeIndicesSet({ datum, selectedIndices: indices }));
  }, [dispatch, datum, traceLength]);

  return (
    <div className='mx-1 my-2 flex flex-col gap-2'>
      {/* Compare-only quick selectors */}
      {mode === 'compare' && (
        <div className='flex items-center gap-1 px-1'>
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
        label={(index) => `State ${index}/${traceLength}`}
        onChange={moveTo}
        onNodeClick={mode === 'compare' ? toggleAt : moveTo}
        onToggleCollapse={() => setIsCollapsed((collapsed) => !collapsed)}
      />

      {mode === 'compare' && compareSet.length > 1 && (
        <p className='px-1 text-xs font-medium text-accent'>
          ✓ {compareSet.length} states selected — showing side-by-side
        </p>
      )}
    </div>
  );
};

export { TimePicker };
