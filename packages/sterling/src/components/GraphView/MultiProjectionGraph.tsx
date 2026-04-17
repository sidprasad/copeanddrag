import { DatumParsed } from '@/sterling-connection';
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import type { LayoutState, TransformInfo, NodePositionHint } from './SpyTialGraph';
import { parseCndFile, CndProjection, SequencePolicyName } from '../../utils/cndPreParser';
import { getSpytialCore, hasSpytialCore } from '../../utils/spytialCore';

// Use the Window type declaration from SpyTialGraph.tsx - no need to re-declare

/**
 * The signature label that Forge uses to indicate no more instances are available.
 */
const NO_MORE_INSTANCES_SIG_LABEL = 
  'No more instances! Some equivalent instances may have been removed through symmetry breaking.';

/**
 * Check if an AlloyDataInstance represents the "no more instances" state.
 */
function isOutOfInstances(alloyDataInstance: any): boolean {
  try {
    const types = alloyDataInstance.getTypes?.() || [];
    return types.some((type: any) => {
      const typeId = type.id || type.getId?.() || '';
      return typeId === NO_MORE_INSTANCES_SIG_LABEL;
    });
  } catch {
    return false;
  }
}

interface ProjectionData {
  typeId: string;
  typeName: string;
  atoms: { id: string; label: string }[];
}

interface MultiProjectionGraphProps {
  datum: DatumParsed<any>;
  cndSpec: string;
  /** Index of the current time step in a temporal trace */
  timeIndex?: number;
  /** The type to project over (e.g., "State", "Time") */
  projectionType: string;
  /** The atom IDs to show (from multi-select) */
  selectedAtoms: string[];
}

interface SingleProjectionPaneProps {
  datum: DatumParsed<any>;
  cndSpec: string;
  timeIndex?: number;
  projectionType: string;
  atomId: string;
  atomLabel: string;
  index: number;
}

/**
 * A single pane showing one projection value
 */
const SingleProjectionPane = (props: SingleProjectionPaneProps) => {
  const { datum, cndSpec, timeIndex, projectionType, atomId, atomLabel, index } = props;
  
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const graphElementRef = useRef<HTMLElementTagNameMap['webcola-cnd-graph'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isInitializedRef = useRef(false);
  const layoutRef = useRef<any>(null);
  
  // Debug logging
  console.log(`[SingleProjectionPane] projectionType=${projectionType}, atomId=${atomId}, atomLabel=${atomLabel}`);

  /**
   * Load and render the graph using SpyTial/CnD
   */
  const loadGraph = useCallback(async () => {
    if (!graphElementRef.current) return;
    
    setIsLoading(true);
    setError(null);

    const core = getSpytialCore();
    if (!core) {
      setError('CnD Core library is not available.');
      setIsLoading(false);
      return;
    }

    try {
      const alloyXml = datum.data;
      if (!alloyXml) {
        throw new Error('No Alloy XML data available in datum');
      }

      // Parse Alloy XML
      const alloyDatum = core.AlloyInstance.parseAlloyXML(alloyXml);
      
      if (!alloyDatum.instances || alloyDatum.instances.length === 0) {
        throw new Error('No instances found in Alloy XML');
      }

      // Create AlloyDataInstance for the current time index
      const instanceIndex = timeIndex !== undefined ? Math.min(timeIndex, alloyDatum.instances.length - 1) : 0;
      const alloyDataInstance = new core.AlloyDataInstance(alloyDatum.instances[instanceIndex]);

      // Check if this is the "no more instances" marker from Forge
      if (isOutOfInstances(alloyDataInstance)) {
        setError('No more instances available.');
        setIsLoading(false);
        return;
      }

      // Create SGraphQueryEvaluator
      const sgraphEvaluator = new core.SGraphQueryEvaluator();
      sgraphEvaluator.initialize({ sourceData: alloyDataInstance });

      // Parse layout specification using pre-parser to strip projections/sequence blocks
      const parsedCnd = parseCndFile(cndSpec || '');
      let layoutSpec = null;
      try {
        layoutSpec = core.parseLayoutSpec(parsedCnd.layoutYaml);
      } catch (parseError: any) {
        console.error(`[Projection ${atomLabel}] Layout spec parse error:`, parseError);
        layoutSpec = core.parseLayoutSpec('');
      }

      // Apply projection transform for THIS specific atom
      // This replaces the old pattern of passing projections to generateLayout()
      let instanceForLayout = alloyDataInstance;
      if (projectionType && atomId && core.applyProjectionTransform) {
        try {
          const projConfig = [{ sig: projectionType }];
          const selections = { [projectionType]: atomId };
          const projResult = core.applyProjectionTransform(
            alloyDataInstance,
            projConfig,
            selections,
            {
              evaluateOrderBy: (selector: string) => {
                try {
                  return sgraphEvaluator.evaluate(selector).selectedTwoples();
                } catch {
                  return [];
                }
              }
            }
          );
          if (projResult && projResult.instance) {
            instanceForLayout = projResult.instance;
          }
        } catch (err: any) {
          console.error(`[Projection ${atomLabel}] Projection transform failed:`, err);
          // Fall back to un-projected instance
        }
      }

      // Create LayoutInstance
      const ENABLE_ALIGNMENT_EDGES = true;
      const layoutInstance = new core.LayoutInstance(
        layoutSpec,
        sgraphEvaluator,
        0,
        ENABLE_ALIGNMENT_EDGES
      );

      // Generate layout with single-arg (projection already applied via transform)
      const layoutResult = layoutInstance.generateLayout(instanceForLayout);

      if (layoutResult.error) {
        console.error(`[Projection ${atomLabel}] Layout generation error:`, layoutResult.error);
        setError(`Layout error: ${layoutResult.error.message}`);
      }

      // Store the layout
      layoutRef.current = layoutResult.layout;

      // Render the layout
      if (graphElementRef.current && layoutResult.layout) {
        // Clear stale graph state (including leftover alignment edges) before
        // rendering the new layout, so nothing from the prior render bleeds through.
        if (graphElementRef.current.clear) {
          graphElementRef.current.clear();
        }
        await graphElementRef.current.renderLayout(layoutResult.layout);
      }

      setIsLoading(false);
    } catch (err: any) {
      console.error(`[Projection ${atomLabel}] Error rendering graph:`, err);
      setError(`Error: ${err.message}`);
      setIsLoading(false);
    }
  }, [datum.data, datum.id, cndSpec, timeIndex, projectionType, atomId, atomLabel]);

  // Create and mount the webcola-cnd-graph element once
  useEffect(() => {
    if (!graphContainerRef.current || isInitializedRef.current) return;

    const graphElement = document.createElement('webcola-cnd-graph') as HTMLElementTagNameMap['webcola-cnd-graph'];
    graphElement.id = `spytial-graph-projection-${index}`;
    graphElement.setAttribute('layoutFormat', 'default');
    graphElement.setAttribute('aria-label', `Graph visualization for ${atomLabel}`);
    graphElement.style.cssText = `
      width: 100%;
      height: 100%;
      min-height: 200px;
      display: block;
    `;

    graphContainerRef.current.appendChild(graphElement);
    graphElementRef.current = graphElement;
    isInitializedRef.current = true;

    return () => {
      if (graphElementRef.current) {
        if (graphElementRef.current.clear) {
          graphElementRef.current.clear();
        }
        if (graphContainerRef.current && graphElementRef.current.parentNode === graphContainerRef.current) {
          graphContainerRef.current.removeChild(graphElementRef.current);
        }
      }
      graphElementRef.current = null;
      layoutRef.current = null;
      isInitializedRef.current = false;
    };
  }, [index, atomLabel]);

  // Load graph when dependencies change
  useEffect(() => {
    if (graphElementRef.current && hasSpytialCore()) {
      loadGraph();
    }
  }, [datum.data, cndSpec, timeIndex, loadGraph]);

  return (
    <div className="relative flex flex-col border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Header with projection label */}
      <div className="px-3 py-2 bg-gray-100 border-b border-gray-200">
        <span className="font-medium text-sm text-gray-700">{atomLabel}</span>
      </div>
      
      {/* Graph container */}
      <div 
        ref={graphContainerRef}
        className="flex-1"
        style={{ 
          minHeight: '250px',
          background: 'white'
        }}
      />
      
      {/* Loading overlay */}
      {isLoading && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75"
          style={{ zIndex: 10, pointerEvents: 'none' }}
        >
          <div className="text-gray-600 text-sm">Loading...</div>
        </div>
      )}
      
      {/* Error display */}
      {error && (
        <div className="px-3 py-2 bg-red-50 border-t border-red-200 text-red-600 text-xs">
          {error}
        </div>
      )}
    </div>
  );
};

/**
 * Component that renders multiple graphs in a grid, one for each selected projection value
 */
const MultiProjectionGraph = (props: MultiProjectionGraphProps) => {
  const { datum, cndSpec, timeIndex, projectionType, selectedAtoms } = props;
  
  // Debug logging for props
  console.log('[MultiProjectionGraph] Props:', { projectionType, selectedAtoms, datumId: datum?.id });
  
  const [projectionData, setProjectionData] = useState<ProjectionData[]>([]);
  const [isCndCoreReady, setIsCndCoreReady] = useState(hasSpytialCore());
  const [error, setError] = useState<string | null>(null);

  // Poll for CndCore availability
  useEffect(() => {
    if (isCndCoreReady) return;

    const checkCndCore = () => {
      if (hasSpytialCore()) {
        setIsCndCoreReady(true);
        return true;
      }
      return false;
    };

    if (checkCndCore()) return;

    let attempts = 0;
    const maxAttempts = 100;
    const intervalId = setInterval(() => {
      attempts++;
      if (checkCndCore() || attempts >= maxAttempts) {
        clearInterval(intervalId);
        if (attempts >= maxAttempts && !isCndCoreReady) {
          setError('CnD Core library failed to load.');
        }
      }
    }, 100);

    return () => clearInterval(intervalId);
  }, [isCndCoreReady]);

  // Extract projection data from the datum to get atom labels
  useEffect(() => {
    if (!isCndCoreReady || !datum.data) return;

    try {
      const alloyXml = datum.data;
      const core = getSpytialCore();
      if (!core) {
        setError('CnD Core library is not available.');
        return;
      }

      const alloyDatum = core.AlloyInstance.parseAlloyXML(alloyXml);
      
      if (!alloyDatum.instances || alloyDatum.instances.length === 0) {
        setError('No instances found in Alloy XML');
        return;
      }

      const instanceIndex = timeIndex !== undefined ? Math.min(timeIndex, alloyDatum.instances.length - 1) : 0;
      const alloyDataInstance = new core.AlloyDataInstance(alloyDatum.instances[instanceIndex]);

      // Check if this is the "no more instances" marker from Forge
      if (isOutOfInstances(alloyDataInstance)) {
        setError('No more instances available.');
        return;
      }

      // Create evaluator to get projection data
      const sgraphEvaluator = new core.SGraphQueryEvaluator();
      sgraphEvaluator.initialize({ sourceData: alloyDataInstance });

      // Parse layout spec using pre-parser
      const parsedCnd = parseCndFile('');
      const layoutSpec = core.parseLayoutSpec(parsedCnd.layoutYaml);
      const layoutInstance = new core.LayoutInstance(layoutSpec, sgraphEvaluator, 0, true);
      const layoutResult = layoutInstance.generateLayout(alloyDataInstance);

      if (layoutResult.projectionData) {
        setProjectionData(layoutResult.projectionData);
      }
    } catch (err: any) {
      console.error('Error extracting projection data:', err);
      setError(`Error: ${err.message}`);
    }
  }, [datum.data, timeIndex, isCndCoreReady]);

  // Get the atoms to render - only the selected ones, with their labels
  const atomsToRender = useMemo(() => {
    // Find the projection type data to get labels
    const typeData = projectionData.find(p => p.typeId === projectionType || p.typeName === projectionType);
    console.log('[MultiProjectionGraph] Looking for typeData:', { projectionType, found: typeData, allTypes: projectionData.map(p => ({ typeId: p.typeId, typeName: p.typeName })) });
    const allAtoms = typeData?.atoms || [];
    
    // Create a map for quick lookup
    const atomMap = new Map(allAtoms.map(a => [a.id, a]));
    
    // Return selected atoms with their labels (fallback to atomId if no match)
    return selectedAtoms.map(atomId => {
      const atomData = atomMap.get(atomId);
      return {
        id: atomId,
        label: atomData?.label || atomId  // Use atomId as label if not found
      };
    });
  }, [projectionData, projectionType, selectedAtoms]);

  // Calculate grid columns based on number of projections
  const gridCols = useMemo(() => {
    const count = atomsToRender.length;
    if (count <= 2) return count;
    if (count <= 4) return 2;
    if (count <= 6) return 3;
    return 4;
  }, [atomsToRender.length]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-red-600 bg-red-50 p-4 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  if (!isCndCoreReady) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600">Loading CnD Core...</div>
      </div>
    );
  }

  if (atomsToRender.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-gray-600 bg-gray-50 p-4 rounded-lg">
          No atoms selected for projection type "{projectionType}".
        </div>
      </div>
    );
  }

  // Get the type name for display (prefer typeName over typeId)
  const displayTypeName = useMemo(() => {
    const typeData = projectionData.find(p => p.typeId === projectionType || p.typeName === projectionType);
    return typeData?.typeName || projectionType || 'Unknown';
  }, [projectionData, projectionType]);

  return (
    <div 
      className="absolute inset-0 overflow-auto bg-gray-100 p-4"
    >
      <div className="mb-4 px-2">
        <h2 className="text-lg font-semibold text-gray-800">
          Projections over {displayTypeName}
        </h2>
        <p className="text-sm text-gray-600">
          Showing {atomsToRender.length} selected projection{atomsToRender.length !== 1 ? 's' : ''}
        </p>
      </div>
      
      <div 
        className="grid gap-4"
        style={{ 
          gridTemplateColumns: `repeat(${gridCols}, minmax(300px, 1fr))`,
        }}
      >
        {atomsToRender.map((atom, index) => (
          <SingleProjectionPane
            key={atom.id}
            datum={datum}
            cndSpec={cndSpec}
            timeIndex={timeIndex}
            projectionType={projectionType}
            atomId={atom.id}
            atomLabel={atom.label}
            index={index}
          />
        ))}
      </div>
    </div>
  );
};

export { MultiProjectionGraph };
export type { MultiProjectionGraphProps, ProjectionData };
