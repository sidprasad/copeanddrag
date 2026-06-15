import { DatumParsed } from '@/sterling-connection';
import { useCallback } from 'react';
import type { PresentationMode } from '../../../../../state/graphs/graphs';
import {
  presentationModeSet,
  selectedTimeIndicesSet
} from '../../../../../state/graphs/graphsSlice';
import {
  useSterlingDispatch,
  useSterlingSelector
} from '../../../../../state/hooks';
import {
  selectPresentationMode,
  selectSelectedTimeIndices,
  selectTimeIndex
} from '../../../../../state/selectors';

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

/** Compact dropdown that picks how trace states are presented. */
const PresentationModeSelect = ({ datum }: { datum: DatumParsed<any> }) => {
  const dispatch = useSterlingDispatch();
  const mode = useSterlingSelector((state) =>
    selectPresentationMode(state, datum)
  );
  const compareSet = useSterlingSelector((state) =>
    selectSelectedTimeIndices(state, datum)
  );
  const timeIndex = useSterlingSelector((state) =>
    selectTimeIndex(state, datum)
  );

  const changeMode = useCallback(
    (next: PresentationMode) => {
      if (next === mode) return;
      // Entering compare with no prior selection: seed it with the current
      // state so there's something on screen. A previous compare selection is
      // preserved (we only seed when empty).
      if (next === 'compare' && compareSet.length === 0) {
        dispatch(
          selectedTimeIndicesSet({ datum, selectedIndices: [timeIndex] })
        );
      }
      dispatch(presentationModeSet({ datum, mode: next }));
    },
    [mode, compareSet.length, dispatch, datum, timeIndex]
  );

  return (
    <label
      htmlFor='presentation-mode-select'
      className='flex min-w-0 flex-1 items-center gap-2'
      title={MODE_OPTIONS.find((o) => o.value === mode)?.description}
    >
      <span className='whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-ink-muted'>
        Show
      </span>
      <select
        id='presentation-mode-select'
        value={mode}
        onChange={(e) => changeMode(e.target.value as PresentationMode)}
        className='min-w-0 flex-1 rounded border border-rule-strong bg-surface px-2 py-1 text-sm shadow-sm focus:border-accent-border focus:outline-none focus:ring-1 focus:ring-accent'
      >
        {MODE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
};

export { PresentationModeSelect };
