import { DatumParsed } from '@/sterling-connection';
import { useSterlingDispatch, useSterlingSelector } from '../../../../../state/hooks';
import { selectSequencePolicyName, selectCnDDraftSpec } from '../../../../../state/selectors';
import { temporalPolicySet, cndSpecSet } from '../../../../../state/graphs/graphsSlice';
import type { SequencePolicyName } from '../../../../../utils/cndPreParser';
import { updateCndSpecTemporalPolicy } from '../../../../../utils/cndSpecMutations';

/** Display labels for the four supported temporal policies. */
const POLICY_OPTIONS: { value: SequencePolicyName; label: string; description: string }[] = [
  {
    value: 'ignore_history',
    label: 'Ignore History',
    description: 'No temporal continuity — each state is laid out independently.',
  },
  {
    value: 'stability',
    label: 'Stability',
    description: 'Nodes try to stay in the same position across states.',
  },
  {
    value: 'change_emphasis',
    label: 'Change Emphasis',
    description: 'Nodes that change are given visual emphasis.',
  },
  {
    value: 'random_positioning',
    label: 'Random Positioning',
    description: 'Randomised positions at each step.',
  },
];

/**
 * UI section shown in the Time drawer that displays the current temporal
 * (sequence) policy and lets the user change it via a dropdown.
 */
const TemporalPolicySection = ({ datum }: { datum: DatumParsed<any> }) => {
  const dispatch = useSterlingDispatch();
  const currentPolicy = useSterlingSelector((state) =>
    selectSequencePolicyName(state, datum)
  );
  const currentCndDraftSpec = useSterlingSelector((state) =>
    selectCnDDraftSpec(state, datum)
  );

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPolicy = e.target.value as SequencePolicyName;
    if (newPolicy === currentPolicy) return;

    // Update the lightweight Redux state first (for immediate UI update)
    dispatch(temporalPolicySet({ datum, policy: newPolicy }));

    // Also update the full CND spec so that the temporal block is persisted
    // when the user exports or re-applies the layout.
    try {
      const updatedSpec = updateCndSpecTemporalPolicy(
        currentCndDraftSpec,
        newPolicy
      );
      dispatch(cndSpecSet({ datum, spec: updatedSpec }));
    } catch {
      // If parsing fails, at least the Redux state was already updated
    }
  };

  return (
    <label
      htmlFor='temporal-policy-select'
      className='flex min-w-0 flex-1 items-center gap-2'
      title={POLICY_OPTIONS.find((o) => o.value === currentPolicy)?.description}
    >
      <span className='whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-ink-muted'>
        Policy
      </span>
      <select
        id='temporal-policy-select'
        value={currentPolicy}
        onChange={handleChange}
        className='min-w-0 flex-1 rounded border border-rule-strong bg-surface px-2 py-1 text-sm shadow-sm focus:border-accent-border focus:outline-none focus:ring-1 focus:ring-accent'
      >
        {POLICY_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
};

export { TemporalPolicySection };
