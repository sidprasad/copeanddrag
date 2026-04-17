import { DatumParsed } from '@/sterling-connection';
import { useSterlingDispatch, useSterlingSelector } from '../../../../../state/hooks';
import { selectSequencePolicyName, selectCnDSpec } from '../../../../../state/selectors';
import { temporalPolicySet, cndSpecSet } from '../../../../../state/graphs/graphsSlice';
import type { SequencePolicyName } from '../../../../../utils/cndPreParser';
import { parseCndFile } from '../../../../../utils/cndPreParser';
import * as yaml from 'js-yaml';

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
  const currentCndSpec = useSterlingSelector((state) =>
    selectCnDSpec(state, datum)
  );

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPolicy = e.target.value as SequencePolicyName;
    if (newPolicy === currentPolicy) return;

    // Update the lightweight Redux state first (for immediate UI update)
    dispatch(temporalPolicySet({ datum, policy: newPolicy }));

    // Also update the full CND spec so that the temporal block is persisted
    // when the user exports or re-applies the layout.
    try {
      const specText = currentCndSpec || '';
      const parsed = parseCndFile(specText);
      // Rebuild the full spec with the new temporal policy
      let fullObj: Record<string, unknown> = {};
      if (specText.trim()) {
        const raw = yaml.load(specText);
        if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
          fullObj = raw as Record<string, unknown>;
        }
      }
      // Remove old 'sequence' key if present, use 'temporal'
      delete fullObj.sequence;
      if (newPolicy !== 'ignore_history') {
        fullObj.temporal = { policy: newPolicy };
      } else {
        delete fullObj.temporal;
      }
      const updatedSpec = Object.keys(fullObj).length > 0
        ? yaml.dump(fullObj, { lineWidth: -1 })
        : '';
      dispatch(cndSpecSet({ datum, spec: updatedSpec }));
    } catch {
      // If parsing fails, at least the Redux state was already updated
    }
  };

  return (
    <div className='px-4 py-3'>
      <label
        htmlFor='temporal-policy-select'
        className='block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1'
      >
        Temporal Policy
      </label>
      <select
        id='temporal-policy-select'
        value={currentPolicy}
        onChange={handleChange}
        className='w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
      >
        {POLICY_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <p className='mt-1 text-xs text-gray-400'>
        {POLICY_OPTIONS.find((o) => o.value === currentPolicy)?.description}
      </p>
    </div>
  );
};

export { TemporalPolicySection };
