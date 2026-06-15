import { DatumParsed } from '@/sterling-connection';
import { ReactElement } from 'react';
import { MdViewColumn, MdViewStream } from 'react-icons/md';
import type { ComparisonLayout } from '../../../../../state/graphs/graphs';
import { comparisonLayoutSet } from '../../../../../state/graphs/graphsSlice';
import {
  useSterlingDispatch,
  useSterlingSelector
} from '../../../../../state/hooks';
import { selectComparisonLayout } from '../../../../../state/selectors';

const OPTIONS: { value: ComparisonLayout; label: string; icon: ReactElement }[] =
  [
    { value: 'horizontal', label: 'Side by side', icon: <MdViewColumn /> },
    { value: 'vertical', label: 'Stacked', icon: <MdViewStream /> }
  ];

/** Compact two-button toggle for the flow of side-by-side state panes. */
const ComparisonLayoutToggle = ({ datum }: { datum: DatumParsed<any> }) => {
  const dispatch = useSterlingDispatch();
  const layout = useSterlingSelector((state) =>
    selectComparisonLayout(state, datum)
  );

  return (
    <div
      className='flex items-center gap-1'
      role='group'
      aria-label='Pane layout'
    >
      {OPTIONS.map((opt) => {
        const active = opt.value === layout;
        return (
          <button
            key={opt.value}
            type='button'
            title={opt.label}
            aria-label={opt.label}
            aria-pressed={active}
            onClick={() =>
              dispatch(comparisonLayoutSet({ datum, layout: opt.value }))
            }
            className={[
              'rounded-md border p-1.5 text-base transition-colors',
              active
                ? 'border-accent-border bg-accent-bg text-accent-ink'
                : 'border-rule text-ink-muted hover:bg-surface-sunken hover:text-ink'
            ].join(' ')}
          >
            {opt.icon}
          </button>
        );
      })}
    </div>
  );
};

export { ComparisonLayoutToggle };
