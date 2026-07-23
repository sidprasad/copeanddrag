import { PaneTitle } from '@/sterling-ui';
import { useCallback, useMemo, useState } from 'react';
import { useSterlingDispatch, useSterlingSelector } from '../../../../state/hooks';
import {
  selectActiveDatum,
  selectCnDDraftSpec,
  selectProjectableTypes
} from '../../../../state/selectors';
import { cndSpecSet } from '../../../../state/graphs/graphsSlice';
import { ProjectionSection } from '../state/ProjectionSection';
import type { CndProjection } from '../../../../utils/cndPreParser';
import {
  getCndSpecProjections,
  updateCndSpecProjections
} from '../../../../utils/cndSpecMutations';

const GraphProjectionsDrawer = () => {
  const dispatch = useSterlingDispatch();
  const activeDatum = useSterlingSelector(selectActiveDatum);
  const [manualType, setManualType] = useState('');

  // Live editing draft of the CND spec (the Layout editor's value; falls back
  // to the applied spec). Reading the draft here composes projection changes
  // with any in-progress hand edits.
  const cndDraftSpec = useSterlingSelector((state) =>
    activeDatum ? selectCnDDraftSpec(state, activeDatum) : ''
  ) || '';

  // All projectable types from the instance (Record<typeId, atomIds[]>)
  // Selector is wrapped in try-catch to prevent errors from crashing the component
  const projectableTypes: Record<string, string[]> = useSterlingSelector((state) => {
    try {
      return activeDatum ? selectProjectableTypes(state, activeDatum) : {};
    } catch (e) {
      console.warn('[GraphProjectionsDrawer] selectProjectableTypes error:', e);
      return {};
    }
  });

  // The controls must reflect the live editor document, not the last applied
  // projection cache. Otherwise adding/removing here can erase unapplied
  // projection rules inferred by Suggest Layout or typed in the editor.
  const currentProjections: CndProjection[] = useMemo(
    () => getCndSpecProjections(cndDraftSpec),
    [cndDraftSpec]
  );

  // Types not yet projected over
  const availableTypes = useMemo(() => {
    const projectedTypeNames = new Set(currentProjections.map((p) => p.type));
    return Object.keys(projectableTypes).filter((t) => !projectedTypeNames.has(t));
  }, [projectableTypes, currentProjections]);

  // ── Add a projection type ─────────────────────────────────────────
  const handleAddProjection = useCallback(
    (typeName: string) => {
      if (!activeDatum || !typeName.trim()) return;
      const type = typeName.trim();
      if (currentProjections.some((projection) => projection.type === type)) return;
      const updated = [...currentProjections, { type }];
      let newSpec: string;
      try {
        newSpec = updateCndSpecProjections(cndDraftSpec, updated);
      } catch (error) {
        console.warn('[GraphProjectionsDrawer] Cannot edit invalid CnD YAML:', error);
        return;
      }
      // cndSpecSet atomically commits this value to the graph and editor.
      dispatch(cndSpecSet({ datum: activeDatum, spec: newSpec }));
    },
    [activeDatum, currentProjections, cndDraftSpec, dispatch]
  );

  // ── Remove a projection type ──────────────────────────────────────
  const handleRemoveProjection = useCallback(
    (typeName: string) => {
      if (!activeDatum) return;
      const updated = currentProjections.filter((p) => p.type !== typeName);
      let newSpec: string;
      try {
        newSpec = updateCndSpecProjections(cndDraftSpec, updated);
      } catch (error) {
        console.warn('[GraphProjectionsDrawer] Cannot edit invalid CnD YAML:', error);
        return;
      }
      // cndSpecSet atomically commits this value to the graph and editor.
      dispatch(cndSpecSet({ datum: activeDatum, spec: newSpec }));
    },
    [activeDatum, currentProjections, cndDraftSpec, dispatch]
  );

  // ── Manual add via text input ─────────────────────────────────────
  const handleManualAdd = useCallback(() => {
    if (manualType.trim()) {
      handleAddProjection(manualType.trim());
      setManualType('');
    }
  }, [manualType, handleAddProjection]);

  if (!activeDatum) {
    return (
      <div className='absolute inset-0 flex flex-col overflow-y-auto'>
        <div className='mx-2 mt-2 rounded-lg border border-rule bg-surface p-3 shadow-sm'>
          <p className='text-xs text-ink-muted'>
            No active instance. Run a model to configure projections.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='absolute inset-0 flex flex-col overflow-y-auto'>
      {/* ── Add Projection ─────────────────────────────────────── */}
      <div className='mx-2 mt-2 mb-1 rounded-lg border border-rule bg-surface p-3 shadow-sm'>
        <span className='text-sm font-semibold text-ink'>
          Add Projection
        </span>
        {availableTypes.length > 0 && (
          <div className='mt-2 flex flex-wrap gap-1.5'>
            {availableTypes.map((typeName) => (
              <button
                key={typeName}
                type='button'
                onClick={() => handleAddProjection(typeName)}
                className='px-2.5 py-1 text-xs rounded-md font-medium bg-success-bg text-success border border-success-border hover:bg-success-bg transition-colors'
              >
                + {typeName}
              </button>
            ))}
          </div>
        )}
        {/* Manual type input — always available as fallback */}
        <div className='mt-2 flex gap-1.5'>
          <input
            type='text'
            value={manualType}
            onChange={(e) => setManualType(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleManualAdd(); }}
            placeholder='Type name (e.g. State)'
            className='flex-1 px-2 py-1 text-xs rounded-md border border-rule bg-surface-muted focus:outline-none focus:border-accent-border focus:ring-1 focus:ring-accent'
          />
          <button
            type='button'
            onClick={handleManualAdd}
            disabled={!manualType.trim()}
            className='px-2.5 py-1 text-xs rounded-md font-medium bg-accent text-on-accent hover:bg-accent disabled:bg-surface-sunken disabled:cursor-not-allowed transition-colors'
          >
            Add
          </button>
        </div>
      </div>

      {/* ── Active Projections ─────────────────────────────────── */}
      {currentProjections.length > 0 && (
        <div className='mx-2 mt-1 mb-1 rounded-lg border border-rule bg-surface p-3 shadow-sm'>
          <span className='text-sm font-semibold text-ink'>
            Active Projections
          </span>
          <div className='mt-2 space-y-1.5'>
            {currentProjections.map((proj) => (
              <div
                key={proj.type}
                className='flex items-center justify-between rounded-md bg-accent-bg px-2.5 py-1.5'
              >
                <span className='text-xs font-medium text-accent'>
                  {proj.type}
                  {proj.orderBy && (
                    <span className='ml-1 text-accent font-normal'>
                      (ordered by {proj.orderBy})
                    </span>
                  )}
                </span>
                <button
                  type='button'
                  onClick={() => handleRemoveProjection(proj.type)}
                  className='ml-2 text-xs text-danger hover:text-danger font-medium transition-colors'
                  title={`Remove ${proj.type} projection`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Atom Selection (existing ProjectionSection) ────────── */}
      <ProjectionSection datum={activeDatum} />
    </div>
  );
};

const GraphProjectionsDrawerHeader = () => {
  return (
    <div className='flex items-center px-2 space-x-2'>
      <PaneTitle>Projections</PaneTitle>
    </div>
  );
};

export { GraphProjectionsDrawer, GraphProjectionsDrawerHeader };
