import { Pane, PaneBody, PaneHeader } from '@/sterling-ui';
import { useCallback, useMemo, useRef } from 'react';
import { useSterlingDispatch, useSterlingSelector } from '../../state/hooks';
import { 
  selectActiveDatum, 
  selectCnDSpec, 
  selectTimeIndex,
  selectIsSynthesisActive,
  selectSynthesisStep,
  selectSelectedProjections,
  selectSelectedTimeIndices,
  selectTraceLength,
  selectProjectionConfig,
  selectSequencePolicyName
} from '../../state/selectors';
import { setCurrentDataInstance } from '../../state/synthesis/synthesisSlice';
import { selectedProjectionsSet } from '../../state/graphs/graphsSlice';
import { SpyTialGraph } from './SpyTialGraph';
import { MultiProjectionGraph } from './MultiProjectionGraph';
import { MultiTemporalGraph } from './MultiTemporalGraph';
import type { LayoutState } from './SpyTialGraph';
import { GraphViewHeader } from './GraphViewHeader';

interface ProjectionTypeData {
  typeId: string;
  typeName: string;
  atoms: { id: string; label: string }[];
}

const normalizeProjectionData = (data: any[]): ProjectionTypeData[] => {
  return (data || []).map((typeData) => {
    const typeName = typeData.type || typeData.typeName || typeData.name || typeData.typeId || '';
    const typeId = typeName;
    const rawAtoms = typeData.atoms || [];
    const atoms = rawAtoms.map((atom: any) => {
      if (typeof atom === 'string') {
        return { id: atom, label: atom };
      }
      return {
        id: atom.id || atom.atomId || atom.name || atom.label || '',
        label: atom.label || atom.name || atom.id || atom.atomId || ''
      };
    });
    return { typeId, typeName, atoms };
  });
};

const GraphView = () => {
  const dispatch = useSterlingDispatch();
  const datum = useSterlingSelector(selectActiveDatum);
  const cndSpec = useSterlingSelector((state) => 
    datum ? selectCnDSpec(state, datum) : ''
  );
  const timeIndex = useSterlingSelector((state) =>
    datum ? selectTimeIndex(state, datum) : 0
  );
  
  // Get trace length for multi-temporal view
  const traceLength = useSterlingSelector((state) =>
    datum ? selectTraceLength(state, datum) : 1
  );
  
  // Selected projections for multi-graph view
  const selectedProjections = useSterlingSelector((state) =>
    datum ? selectSelectedProjections(state, datum) : {}
  );
  
  // Selected time indices for multi-temporal view
  const selectedTimeIndices = useSterlingSelector((state) =>
    datum ? selectSelectedTimeIndices(state, datum) : []
  );

  // CND-derived projection config and sequence policy
  const projectionConfig = useSterlingSelector((state) =>
    datum ? selectProjectionConfig(state, datum) : []
  ) || [];
  const sequencePolicyName = useSterlingSelector((state) =>
    datum ? selectSequencePolicyName(state, datum) : undefined
  );
  
  // Calculate total number of graphs to show
  // For now, we use the first projection type that has multiple selections
  const multiProjectionInfo = useMemo(() => {
    console.log('[GraphView] selectedProjections:', selectedProjections);
    for (const [typeId, atoms] of Object.entries(selectedProjections)) {
      console.log(`[GraphView] Checking typeId="${typeId}", atoms:`, atoms);
      if (atoms.length > 1) {
        console.log(`[GraphView] Found multi-projection: typeId="${typeId}" with ${atoms.length} atoms`);
        
        // Get the original order from projectionData to ensure atoms are displayed in correct order
        const projectionData = (window as any).__lastProjectionData as ProjectionTypeData[] | undefined;
        const typeData = projectionData?.find(pd => pd.typeId === typeId);
        
        // Sort atoms according to their order in projectionData.atoms
        let orderedAtoms = atoms;
        if (typeData?.atoms) {
          const atomOrder = typeData.atoms.map(a => a.id);
          orderedAtoms = [...atoms].sort((a, b) => {
            const indexA = atomOrder.indexOf(a);
            const indexB = atomOrder.indexOf(b);
            // If not found in atomOrder, put at end
            return (indexA === -1 ? Infinity : indexA) - (indexB === -1 ? Infinity : indexB);
          });
        }
        
        return { typeId, atoms: orderedAtoms };
      }
    }
    return null;
  }, [selectedProjections]);
  
  // Check if multi-temporal mode is active (more than 1 time index selected)
  const isMultiTemporalActive = selectedTimeIndices.length > 1;

  // Build a Record<string, string> of single-atom selections for applyProjectionTransform
  // (uses the first selected atom per projection type)
  const projectionSelections = useMemo(() => {
    const selections: Record<string, string> = {};
    for (const [typeId, atoms] of Object.entries(selectedProjections)) {
      if (atoms.length > 0) {
        selections[typeId] = atoms[0];
      }
    }
    return selections;
  }, [selectedProjections]);
  
  // Synthesis mode state
  const isSynthesisActive = useSterlingSelector(selectIsSynthesisActive);
  const currentStep = useSterlingSelector(selectSynthesisStep);

  const latestDatumRef = useRef(datum);
  const latestSelectionsRef = useRef(selectedProjections);
  latestDatumRef.current = datum;
  latestSelectionsRef.current = selectedProjections;

  const handleProjectionData = useCallback((rawData: any[]) => {
    const normalized = normalizeProjectionData(rawData || []);
    (window as any).__lastProjectionData = normalized;
    window.dispatchEvent(new CustomEvent('projectionDataUpdated', { detail: normalized }));

    const activeDatum = latestDatumRef.current;
    if (!activeDatum) return;

    const selections = latestSelectionsRef.current || {};

    // When projection directives are removed, clear selections and reset projection state.
    if (normalized.length === 0) {
      Object.keys(selections).forEach((projectionType) => {
        if (selections[projectionType]?.length) {
          dispatch(selectedProjectionsSet({
            datum: activeDatum,
            projectionType,
            selectedAtoms: []
          }));
        }
      });
      if (window.currentProjections) {
        window.currentProjections = {};
      }
      return;
    }

    if (!window.currentProjections) {
      window.currentProjections = {};
    }

    // Keep window.currentProjections in sync with current selections.
    normalized.forEach((typeData) => {
      const currentSelections = selections[typeData.typeId] || [];
      if (currentSelections.length > 0) {
        const current = window.currentProjections[typeData.typeId];
        if (!current || !currentSelections.includes(current)) {
          window.currentProjections[typeData.typeId] = currentSelections[0];
        }
      } else if (window.currentProjections && window.currentProjections[typeData.typeId]) {
        delete window.currentProjections[typeData.typeId];
      }
    });

    // Clean up any projection types that are no longer present.
    const validTypeIds = new Set(normalized.map((d) => d.typeId));
    Object.keys(selections).forEach((projectionType) => {
      if (!validTypeIds.has(projectionType)) {
        dispatch(selectedProjectionsSet({
          datum: activeDatum,
          projectionType,
          selectedAtoms: []
        }));
        if (window.currentProjections && window.currentProjections[projectionType]) {
          delete window.currentProjections[projectionType];
        }
      }
    });
  }, [dispatch]);

  // Ensure projection data always syncs, even when the drawer is not open.
  if (typeof window !== 'undefined') {
    const existingHandler = window.updateProjectionData as any;
    if (!existingHandler || !existingHandler.__isMultiSelectHandler) {
      const handler = (data: any[]) => handleProjectionData(data);
      (handler as any).__isMultiSelectHandler = true;
      window.updateProjectionData = handler;
    }
  }

  // Store layout state for temporal trace continuity
  // We use a ref to avoid re-renders when state changes
  const layoutStateRef = useRef<LayoutState | undefined>(undefined);

  // Callback to update stored layout state after each render
  const handleLayoutStateChange = useCallback((state: LayoutState) => {
    layoutStateRef.current = state;
  }, []);

  // Callback to receive the AlloyDataInstance for synthesis
  const handleDataInstanceCreated = useCallback((dataInstance: any) => {
    if (isSynthesisActive) {
      dispatch(setCurrentDataInstance({ dataInstance }));
    }
  }, [dispatch, isSynthesisActive]);

  // Determine if we should show multiple graphs
  const shouldShowMultiProjection = 
    multiProjectionInfo !== null &&
    !isSynthesisActive &&
    !isMultiTemporalActive;  // Multi-temporal takes precedence
  
  const shouldShowMultiTemporal =
    isMultiTemporalActive &&
    !isSynthesisActive;  // Don't show multi-temporal in synthesis mode

  // Render the appropriate graph component
  const renderGraphContent = () => {
    if (!datum) return null;
    
    // Multi-temporal view takes precedence
    if (shouldShowMultiTemporal) {
      return (
        <MultiTemporalGraph
          datum={datum}
          cndSpec={cndSpec}
          selectedTimeIndices={selectedTimeIndices}
          traceLength={traceLength}
          sequencePolicyName={sequencePolicyName}
        />
      );
    }
    
    if (shouldShowMultiProjection && multiProjectionInfo) {
      return (
        <MultiProjectionGraph
          datum={datum}
          cndSpec={cndSpec}
          timeIndex={timeIndex}
          projectionType={multiProjectionInfo.typeId}
          selectedAtoms={multiProjectionInfo.atoms}
        />
      );
    }
    
    return (
      <SpyTialGraph 
        datum={datum} 
        cndSpec={cndSpec}
        timeIndex={timeIndex}
        priorState={layoutStateRef.current}
        onLayoutStateChange={handleLayoutStateChange}
        synthesisMode={isSynthesisActive && currentStep > 0}
        onDataInstanceCreated={handleDataInstanceCreated}
        projectionConfig={projectionConfig}
        sequencePolicyName={sequencePolicyName}
        projectionSelections={projectionSelections}
      />
    );
  };

  return (
    <Pane className='grid grid-flow-col divide-x divide-dashed'>
      {datum ? (
        <div className='relative'>
          <Pane>
            <PaneHeader className='border-b'>
              <GraphViewHeader datum={datum} />
            </PaneHeader>
            <PaneBody>
              {renderGraphContent()}
            </PaneBody>
          </Pane>
        </div>
      ) : null}
    </Pane>
  );
};

export { GraphView };
