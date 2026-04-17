import { PaneTitle } from '@/sterling-ui';
import { useCallback, useMemo, useState } from 'react';
import { useSterlingDispatch, useSterlingSelector } from '../../../../state/hooks';
import {
  selectActiveDatum,
  selectCnDSpec,
  selectProjectableTypes,
  selectProjectionConfig
} from '../../../../state/selectors';
import { cndSpecSet } from '../../../../state/graphs/graphsSlice';
import { ProjectionSection } from '../state/ProjectionSection';
import type { CndProjection } from '../../../../utils/cndPreParser';
import * as yaml from 'js-yaml';

/**
 * Rebuild a full CND YAML spec string after modifying the projection list.
 * Preserves existing constraints, directives, and temporal config.
 */
function updateCndSpecProjections(
  currentSpec: string,
  newProjections: CndProjection[]
): string {
  let parsed: Record<string, unknown> = {};
  if (currentSpec && currentSpec.trim()) {
    try {
      const raw = yaml.load(currentSpec);
      if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
        parsed = raw as Record<string, unknown>;
      }
    } catch {
      // Start fresh if the current spec is unparseable
    }
  }

  // Remove old projection keys
  delete parsed.projections;
  delete parsed.projection;

  // Add new projections block (only if non-empty)
  if (newProjections.length > 0) {
    parsed.projections = newProjections.map((p) => {
      const entry: Record<string, string> = { sig: p.type };
      if (p.orderBy) entry.orderBy = p.orderBy;
      return entry;
    });
  }

  if (Object.keys(parsed).length === 0) return '';
  return yaml.dump(parsed, { lineWidth: -1 });
}

const GraphProjectionsDrawer = () => {
  const dispatch = useSterlingDispatch();
  const activeDatum = useSterlingSelector(selectActiveDatum);
  const [manualType, setManualType] = useState('');

  // Current CND spec text (may come from the layout editor or Redux)
  const cndSpec = useSterlingSelector((state) =>
    activeDatum ? selectCnDSpec(state, activeDatum) : ''
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

  // Currently configured projections from the CND spec
  const currentProjections: CndProjection[] = useSterlingSelector((state) =>
    activeDatum ? selectProjectionConfig(state, activeDatum) : []
  ) || [];

  // Types not yet projected over
  const availableTypes = useMemo(() => {
    const projectedTypeNames = new Set(currentProjections.map((p) => p.type));
    return Object.keys(projectableTypes).filter((t) => !projectedTypeNames.has(t));
  }, [projectableTypes, currentProjections]);

  // ── Add a projection type ─────────────────────────────────────────
  const handleAddProjection = useCallback(
    (typeName: string) => {
      if (!activeDatum || !typeName.trim()) return;
      const updated = [...currentProjections, { type: typeName.trim() }];
      const specText = window.getCurrentCNDSpecFromReact?.() || cndSpec;
      const newSpec = updateCndSpecProjections(specText, updated);
      dispatch(cndSpecSet({ datum: activeDatum, spec: newSpec }));
    },
    [activeDatum, currentProjections, cndSpec, dispatch]
  );

  // ── Remove a projection type ──────────────────────────────────────
  const handleRemoveProjection = useCallback(
    (typeName: string) => {
      if (!activeDatum) return;
      const updated = currentProjections.filter((p) => p.type !== typeName);
      const specText = window.getCurrentCNDSpecFromReact?.() || cndSpec;
      const newSpec = updateCndSpecProjections(specText, updated);
      dispatch(cndSpecSet({ datum: activeDatum, spec: newSpec }));
    },
    [activeDatum, currentProjections, cndSpec, dispatch]
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
        <div className='mx-2 mt-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm'>
          <p className='text-xs text-gray-500'>
            No active instance. Run a model to configure projections.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='absolute inset-0 flex flex-col overflow-y-auto'>
      {/* ── Add Projection ─────────────────────────────────────── */}
      <div className='mx-2 mt-2 mb-1 rounded-lg border border-slate-200 bg-white p-3 shadow-sm'>
        <span className='text-sm font-semibold text-gray-800'>
          Add Projection
        </span>
        {availableTypes.length > 0 && (
          <div className='mt-2 flex flex-wrap gap-1.5'>
            {availableTypes.map((typeName) => (
              <button
                key={typeName}
                type='button'
                onClick={() => handleAddProjection(typeName)}
                className='px-2.5 py-1 text-xs rounded-md font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors'
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
            className='flex-1 px-2 py-1 text-xs rounded-md border border-gray-200 bg-gray-50 focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200'
          />
          <button
            type='button'
            onClick={handleManualAdd}
            disabled={!manualType.trim()}
            className='px-2.5 py-1 text-xs rounded-md font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors'
          >
            Add
          </button>
        </div>
      </div>

      {/* ── Active Projections ─────────────────────────────────── */}
      {currentProjections.length > 0 && (
        <div className='mx-2 mt-1 mb-1 rounded-lg border border-slate-200 bg-white p-3 shadow-sm'>
          <span className='text-sm font-semibold text-gray-800'>
            Active Projections
          </span>
          <div className='mt-2 space-y-1.5'>
            {currentProjections.map((proj) => (
              <div
                key={proj.type}
                className='flex items-center justify-between rounded-md bg-indigo-50 px-2.5 py-1.5'
              >
                <span className='text-xs font-medium text-indigo-800'>
                  {proj.type}
                  {proj.orderBy && (
                    <span className='ml-1 text-indigo-400 font-normal'>
                      (ordered by {proj.orderBy})
                    </span>
                  )}
                </span>
                <button
                  type='button'
                  onClick={() => handleRemoveProjection(proj.type)}
                  className='ml-2 text-xs text-red-400 hover:text-red-600 font-medium transition-colors'
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
