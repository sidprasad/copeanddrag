import { DatumParsed } from '@/sterling-connection';
import { useCallback, useEffect, useState } from 'react';
import { useSterlingDispatch, useSterlingSelector } from '../../../../state/hooks';
import { selectCnDSpec, selectSelectedProjections, selectProjectionConfig } from '../../../../state/selectors';
import { cndSpecSet, projectionAtomToggled, selectedProjectionsSet } from '../../../../state/graphs/graphsSlice';
import type { CndProjection } from '../../../../utils/cndPreParser';

interface ProjectionTypeData {
  typeId: string;
  typeName: string;
  atoms: { id: string; label: string }[];
}

interface ProjectionSectionProps {
  datum: DatumParsed<any>;
}

const ProjectionSection = ({ datum }: ProjectionSectionProps) => {
  const dispatch = useSterlingDispatch();

  // Projection data from SpyTial - populated via window.updateProjectionData callback
  const [projectionData, setProjectionData] = useState<ProjectionTypeData[]>([]);

  const cndSpec = useSterlingSelector((state) => selectCnDSpec(state, datum)) || '';

  // CND-derived projection config from Redux (parsed from .cnd file)
  const cndProjectionConfig = useSterlingSelector((state) =>
    selectProjectionConfig(state, datum)
  ) || [];

  // Selected projections from Redux
  const selectedProjections = useSterlingSelector((state) =>
    selectSelectedProjections(state, datum)
  );

  // If CND spec defines projections, show a note about the source
  const hasCndProjections = cndProjectionConfig.length > 0;

  // Listen for projection data updates and reset state when datum changes
  useEffect(() => {
    // Reset state for the new datum
    setProjectionData([]);
    if (window.currentProjections) {
      window.currentProjections = {};
    }

    const handleProjectionData = (event: CustomEvent<ProjectionTypeData[]>) => {
      const data = event.detail;
      setProjectionData(data);
    };

    window.addEventListener('projectionDataUpdated', handleProjectionData as EventListener);

    // Check if data was already received before this component mounted
    const existingData = (window as any).__lastProjectionData;
    if (existingData && existingData.length > 0) {
      handleProjectionData({ detail: existingData } as CustomEvent<ProjectionTypeData[]>);
    }

    return () => {
      window.removeEventListener('projectionDataUpdated', handleProjectionData as EventListener);
    };
  }, [datum]);

  // Set default selection (first atom) for each projection type when data is loaded
  useEffect(() => {
    if (projectionData.length === 0) return;

    projectionData.forEach(typeData => {
      const typeSelections = selectedProjections[typeData.typeId] || [];
      // If no atoms are selected for this type and there are atoms available, select the first one
      if (typeSelections.length === 0 && typeData.atoms.length > 0) {
        const firstAtomId = typeData.atoms[0].id;
        
        dispatch(selectedProjectionsSet({
          datum,
          projectionType: typeData.typeId,
          selectedAtoms: [firstAtomId]
        }));

        // Update window.currentProjections for SpyTial
        if (!window.currentProjections) {
          window.currentProjections = {};
        }
        window.currentProjections[typeData.typeId] = firstAtomId;
      }
    });
  }, [projectionData, selectedProjections, datum, dispatch]);

  // Handle toggling a projection atom selection
  // Regular click: select only that atom (single select)
  // Shift+click: toggle behavior (add/remove from selection)
  const handleAtomToggle = useCallback((typeId: string, atomId: string, shiftKey = false) => {
    const isMultiTypeMode = projectionData.length > 1;
    const currentSelections = selectedProjections[typeId] || [];
    
    // Get the type data for ordering
    const typeData = projectionData.find(pd => pd.typeId === typeId);
    
    let newSelections: string[];
    if (isMultiTypeMode) {
      // Multi-type mode: single select only - clicking selects just this atom
      newSelections = [atomId];
    } else {
      // Single-type mode: check for shift key
      if (shiftKey) {
        // Shift+click: toggle behavior for multi-select
        if (currentSelections.includes(atomId)) {
          // Don't allow deselecting the last atom
          if (currentSelections.length === 1) {
            return;
          }
          newSelections = currentSelections.filter(id => id !== atomId);
        } else {
          // Add the new atom and re-order according to projectionData.atoms order
          const updatedSelections = [...currentSelections, atomId];
          if (typeData?.atoms) {
            const atomOrder = typeData.atoms.map(a => a.id);
            newSelections = updatedSelections.sort((a, b) => {
              const indexA = atomOrder.indexOf(a);
              const indexB = atomOrder.indexOf(b);
              return (indexA === -1 ? Infinity : indexA) - (indexB === -1 ? Infinity : indexB);
            });
          } else {
            newSelections = updatedSelections;
          }
        }
      } else {
        // Regular click: single select - just select this atom
        newSelections = [atomId];
      }
    }

    dispatch(selectedProjectionsSet({
      datum,
      projectionType: typeId,
      selectedAtoms: newSelections
    }));

    // Update window.currentProjections for SpyTial
    if (!window.currentProjections) {
      window.currentProjections = {};
    }
    // For single graph mode, use first selected atom
    window.currentProjections[typeId] = newSelections[0] || '';

    // Trigger re-layout
    const cndSpecText = window.getCurrentCNDSpecFromReact?.() || cndSpec;
    dispatch(cndSpecSet({ datum, spec: cndSpecText }));
  }, [datum, dispatch, selectedProjections, cndSpec, projectionData.length]);

  // Select all atoms for a type
  const handleSelectAll = useCallback((typeId: string, atoms: { id: string }[]) => {
    const currentSelections = selectedProjections[typeId] || [];
    const allSelected = currentSelections.length === atoms.length;

    const newSelections = allSelected ? [atoms[0].id] : atoms.map(a => a.id);

    dispatch(selectedProjectionsSet({
      datum,
      projectionType: typeId,
      selectedAtoms: newSelections
    }));

    // Update window.currentProjections
    if (!window.currentProjections) {
      window.currentProjections = {};
    }
    window.currentProjections[typeId] = newSelections[0] || '';

    const cndSpecText = window.getCurrentCNDSpecFromReact?.() || cndSpec;
    dispatch(cndSpecSet({ datum, spec: cndSpecText }));
  }, [datum, dispatch, selectedProjections, cndSpec]);

  // Don't render if no projection data
  if (projectionData.length === 0) {
    return null;
  }

  const isMultiTypeMode = projectionData.length > 1;

  return (
    <div className="mx-2 my-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-800">Projections</span>
        <div className="flex gap-1">
          {hasCndProjections && (
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              CND
            </span>
          )}
          {!isMultiTypeMode && (
            <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              Multi-select
            </span>
          )}
        </div>
      </div>
      {isMultiTypeMode ? (
        <p className="text-xs text-gray-500 mb-3">
          Projecting over multiple types. Select one atom per type.
        </p>
      ) : (
        <p className="text-xs text-gray-500 mb-3">
          Projecting over <span className="font-medium text-gray-700">{projectionData[0].typeName}</span>. 
          Click to select, Shift+click to toggle. Multiple selections show separate graphs.
        </p>
      )}

      {projectionData.map(typeData => {
        const typeSelections = selectedProjections[typeData.typeId] || [];
        const allSelected = typeSelections.length === typeData.atoms.length;

        return (
          <div key={typeData.typeId} className="mb-3 last:mb-0">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-700">
                {typeData.typeName}
              </label>
              {!isMultiTypeMode && (
                <button
                  type="button"
                  onClick={() => handleSelectAll(typeData.typeId, typeData.atoms)}
                  className="text-xs text-indigo-600 hover:text-indigo-800"
                >
                  {allSelected ? 'Select one' : 'Select all'}
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {typeData.atoms.map(atom => {
                const isSelected = typeSelections.includes(atom.id);
                return (
                  <button
                    key={atom.id}
                    type="button"
                    onClick={(e) => handleAtomToggle(typeData.typeId, atom.id, e.shiftKey)}
                    className={`
                      px-2.5 py-1 text-xs rounded-md transition-all font-medium
                      ${isSelected 
                        ? 'bg-indigo-600 text-white shadow-sm' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                      }
                    `}
                  >
                    {atom.label}
                  </button>
                );
              })}
            </div>
            {!isMultiTypeMode && typeSelections.length > 1 && (
              <p className="text-xs text-indigo-600 mt-1.5 font-medium">
                ✓ {typeSelections.length} selected — showing {typeSelections.length} graphs
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export { ProjectionSection };
