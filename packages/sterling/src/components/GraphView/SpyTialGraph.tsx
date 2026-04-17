import { DatumParsed } from '@/sterling-connection';
import { useCallback, useEffect, useRef, useState } from 'react';
import { parseCndFile, type CndProjection, type SequencePolicyName } from '../../utils/cndPreParser';
import { getSpytialCore, hasSpytialCore } from '../../utils/spytialCore';

/**
 * The signature label that Forge uses to indicate no more instances are available.
 * When all instances have been exhausted, Forge sends a special instance with this
 * signature containing an atom labeled "No more instances".
 */
const NO_MORE_INSTANCES_SIG_LABEL = 
  'No more instances! Some equivalent instances may have been removed through symmetry breaking.';

/**
 * Check if an AlloyDataInstance represents the "no more instances" state.
 * Forge signals this by sending an instance with a special signature.
 * 
 * @param alloyDataInstance The AlloyDataInstance to check (from CndCore)
 * @returns true if this instance indicates no more instances are available
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

// LayoutState bundles positions and transform together for temporal continuity
// These types match the spytial-core webcola-cnd-graph component API
export interface TransformInfo {
  k: number;  // scale
  x: number;  // translate x
  y: number;  // translate y
}

export type NodePositionHint = { id: string; x: number; y: number };

export interface LayoutState {
  positions: NodePositionHint[];
  transform: TransformInfo;
}

// Extend HTMLElementTagNameMap for the webcola-cnd-graph custom element
declare global {
  interface HTMLElementTagNameMap {
    'webcola-cnd-graph': HTMLElement & {
      renderLayout: (layout: any, options?: {
        policy?: { readonly name: string; apply: (context: any) => any };
        prevInstance?: any;
        currInstance?: any;
        priorPositions?: LayoutState;
      }) => Promise<void>;
      getLayoutState?: () => LayoutState;
      addToolbarControl?: (element: HTMLElement) => void;
      clear?: () => void;
      // Node highlighting for synthesis mode
      clearNodeHighlights?: () => void;
      highlightNodes?: (nodeIds: string[], color?: string) => boolean;
      highlightNodePairs?: (pairs: [string, string][], options?: { showBadges?: boolean }) => boolean;
    };
  }
}

interface SpyTialGraphProps {
  datum: DatumParsed<any>;
  cndSpec: string;
  /** Index of the current time step in a temporal trace */
  timeIndex?: number;
  /** Callback to share layout state with parent for cross-frame continuity */
  onLayoutStateChange?: (state: LayoutState) => void;
  /** Prior layout state from previous frame for temporal continuity */
  priorState?: LayoutState;
  onCndSpecChange?: (spec: string) => void;
  /** Synthesis mode: enable node selection */
  synthesisMode?: boolean;
  /** Callback to receive the AlloyDataInstance when it's created (for synthesis) */
  onDataInstanceCreated?: (dataInstance: any) => void;
  /** CND-derived projection configuration */
  projectionConfig?: CndProjection[];
  /** CND-derived sequence policy name */
  sequencePolicyName?: SequencePolicyName;
  /** User's current projection atom selections (type → atom ID) */
  projectionSelections?: Record<string, string>;
}

const SpyTialGraph = (props: SpyTialGraphProps) => {
  const { 
    datum, 
    cndSpec, 
    timeIndex, 
    priorState, 
    onLayoutStateChange,
    synthesisMode = false,
    onDataInstanceCreated,
    projectionConfig = [],
    sequencePolicyName = 'ignore_history',
    projectionSelections = {}
  } = props;
  // Separate ref for the graph container - this div is NOT managed by React's children
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const graphElementRef = useRef<HTMLElementTagNameMap['webcola-cnd-graph'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCndCoreReady, setIsCndCoreReady] = useState(hasSpytialCore());
  const isInitializedRef = useRef(false);
  
  // Track the previous data instance for sequence policy continuity
  const prevInstanceRef = useRef<any>(null);

  // Use refs for projection/sequence props so they don't trigger re-layout.
  // These are derived from cndSpec (which IS a dependency), so when cndSpec
  // changes they'll already be updated by the time loadGraph runs.  But they
  // can also get new JS references without semantically changing (e.g. from
  // Redux selector returning new `[]` arrays), and we must NOT re-layout for
  // that.
  const projectionConfigRef = useRef(projectionConfig);
  projectionConfigRef.current = projectionConfig;
  const sequencePolicyNameRef = useRef(sequencePolicyName);
  sequencePolicyNameRef.current = sequencePolicyName;
  const projectionSelectionsRef = useRef(projectionSelections);
  projectionSelectionsRef.current = projectionSelections;

  // Use a ref to store the latest onLayoutStateChange callback
  // This avoids stale closure issues in event listeners
  const onLayoutStateChangeRef = useRef(onLayoutStateChange);
  onLayoutStateChangeRef.current = onLayoutStateChange;

  // Poll for CndCore availability if not ready yet
  useEffect(() => {
    if (isCndCoreReady) return;

    const checkCndCore = () => {
      if (hasSpytialCore()) {
        console.log('CndCore is now available');
        setIsCndCoreReady(true);
        return true;
      }
      return false;
    };

    // Check immediately
    if (checkCndCore()) return;

    // Poll every 100ms for up to 10 seconds
    let attempts = 0;
    const maxAttempts = 100;
    const intervalId = setInterval(() => {
      attempts++;
      if (checkCndCore() || attempts >= maxAttempts) {
        clearInterval(intervalId);
        if (attempts >= maxAttempts && !isCndCoreReady) {
          console.error('CndCore did not load within timeout');
          setError('CnD Core library failed to load. Please refresh the page.');
          setIsLoading(false);
        }
      }
    }, 100);

    return () => clearInterval(intervalId);
  }, [isCndCoreReady]);

  /**
   * Load and render the graph using SpyTial/CnD
   */
  const loadGraph = useCallback(async () => {
    if (!graphElementRef.current) return;
    
    setIsLoading(true);
    setError(null);

    // Check if CndCore is available
    const core = getSpytialCore();
    if (!core) {
      setError('CnD Core library is not available. Please check your internet connection.');
      setIsLoading(false);
      return;
    }

    try {
      // Get the raw Alloy XML from the datum
      const alloyXml = datum.data;
      if (!alloyXml) {
        throw new Error('No Alloy XML data available in datum');
      }

      // Step 1: Parse Alloy XML using CndCore
      //console.log('Parsing Alloy XML...');
      const alloyDatum = core.AlloyInstance.parseAlloyXML(alloyXml);
      
      if (!alloyDatum.instances || alloyDatum.instances.length === 0) {
        throw new Error('No instances found in Alloy XML');
      }

      // Step 2: Create AlloyDataInstance for the current time index
      // For temporal traces, select the instance at the current time step
      const instanceIndex = timeIndex !== undefined ? Math.min(timeIndex, alloyDatum.instances.length - 1) : 0;
      const alloyDataInstance = new core.AlloyDataInstance(alloyDatum.instances[instanceIndex]);
      // console.log('Created Alloy Data Instance:', {
      //   instanceIndex,
      //   totalInstances: alloyDatum.instances.length,
      //   types: alloyDataInstance.getTypes().length,
      //   atoms: alloyDataInstance.getAtoms().length,
      //   relations: alloyDataInstance.getRelations().length
      // });

      // Check if this is the "no more instances" marker from Forge
      if (isOutOfInstances(alloyDataInstance)) {
        console.log('No more instances available from Forge');
        setError('No more instances available. All satisfying instances have been exhausted.');
        setIsLoading(false);
        // Clear the graph to show there's nothing to display
        if (graphElementRef.current?.clear) {
          graphElementRef.current.clear();
        }
        return;
      }

      // Notify parent if in synthesis mode - pass raw instance data (not class) for Redux storage
      if (synthesisMode && onDataInstanceCreated) {
        onDataInstanceCreated(alloyDatum.instances[instanceIndex]);
      }

      // Step 3: Create SGraphQueryEvaluator for layout generation
      // IMPORTANT: Initialize with the ORIGINAL (un-projected) instance so that
      // orderBy selectors and layout selectors can see all atoms.
      const sgraphEvaluator = new core.SGraphQueryEvaluator();
      sgraphEvaluator.initialize({ sourceData: alloyDataInstance });

      // Step 4: Parse layout specification
      // Use parseCndFile to extract only the layout YAML (stripping projections/sequence blocks)
      const parsedCnd = parseCndFile(cndSpec || '');
      let layoutSpec = null;
      try {
        layoutSpec = core.parseLayoutSpec(parsedCnd.layoutYaml);
        if (window.clearAllErrors) {
          window.clearAllErrors();
        }
      } catch (parseError: any) {
        console.error('Layout spec parse error:', parseError);
        if (window.showParseError) {
          window.showParseError(parseError.message, 'Layout Specification');
        }
        layoutSpec = core.parseLayoutSpec('');
      }

      // Step 5: Apply projection transform (pre-layout data transformation)
      // This replaces the old pattern of passing projections to generateLayout()
      let instanceForLayout = alloyDataInstance;
      let projectionChoices: any[] = [];

      const currentProjectionConfig = projectionConfigRef.current;
      const currentProjectionSelections = projectionSelectionsRef.current;

      if (currentProjectionConfig.length > 0 && core.applyProjectionTransform) {
        try {
          const selectionsCopy = { ...currentProjectionSelections };
          // spytial-core expects { sig, orderBy } — our CndProjection uses { type, orderBy }
          const projectionsForCore = currentProjectionConfig.map(p => ({ sig: p.type, orderBy: p.orderBy }));
          const projResult = core.applyProjectionTransform(
            alloyDataInstance,
            projectionsForCore,
            selectionsCopy,
            {
              evaluateOrderBy: (selector: string) => {
                try {
                  return sgraphEvaluator.evaluate(selector).selectedTwoples();
                } catch {
                  return [];
                }
              },
              onOrderByError: (selector: string, error: unknown) => {
                console.warn(`[SpyTialGraph] orderBy evaluation failed for "${selector}":`, error);
              }
            }
          );
          if (projResult && projResult.instance) {
            instanceForLayout = projResult.instance;
          }
          if (projResult && Array.isArray(projResult.choices)) {
            projectionChoices = projResult.choices;
          }
        } catch (err: any) {
          console.error('Projection transform failed:', err);
          // Fall back to un-projected instance
        }
      }

      // Update projection controls with projection choices
      if (window.updateProjectionData) {
        window.updateProjectionData(projectionChoices);
      }

      // Step 6: Create LayoutInstance and generate layout
      const ENABLE_ALIGNMENT_EDGES = true;
      const instanceNumber = 0;
      const layoutInstance = new core.LayoutInstance(
        layoutSpec,
        sgraphEvaluator,
        instanceNumber,
        ENABLE_ALIGNMENT_EDGES
      );

      const layoutResult = layoutInstance.generateLayout(instanceForLayout);

      // Check for selector errors
      if (layoutResult.selectorErrors && layoutResult.selectorErrors.length > 0) {
        console.warn('Selector errors:', layoutResult.selectorErrors);
        if (window.showSelectorErrors) {
          window.showSelectorErrors(layoutResult.selectorErrors);
        }
        if (graphElementRef.current) {
          // Clear stale graph (alignment edges etc.) before showing error state
          if (graphElementRef.current.clear) {
            graphElementRef.current.clear();
          }
          graphElementRef.current.setAttribute('unsat', '');
        }
        setIsLoading(false);
        return;
      }

      // Check for layout errors
      if (layoutResult.error) {
        console.error('Layout generation error:', layoutResult.error);
        
        if (layoutResult.error.type === 'hidden-node-conflict' && window.showHiddenNodeConflict) {
          window.showHiddenNodeConflict(layoutResult.error.errorMessages);
        } else if (layoutResult.error.errorMessages) {
          if (window.showPositionalError) {
            window.showPositionalError(layoutResult.error.errorMessages);
          } else {
            setError(`Positional constraint conflict: ${layoutResult.error.message}`);
          }
        } else if (layoutResult.error.overlappingNodes) {
          if (window.showGroupOverlapError) {
            window.showGroupOverlapError(layoutResult.error.message);
          } else {
            setError(`Group overlap error: ${layoutResult.error.message}`);
          }
        } else {
          if (window.showGeneralError) {
            window.showGeneralError(`Layout generation error: ${layoutResult.error.message}`);
          } else {
            setError(`Layout generation error: ${layoutResult.error.message}`);
          }
        }

        if (graphElementRef.current) {
          graphElementRef.current.setAttribute('unsat', '');
        }
      }

      // Step 7: Render the layout with sequence policy for temporal continuity
      if (graphElementRef.current && layoutResult.layout) {
        // Clear unsat state on success
        graphElementRef.current.removeAttribute('unsat');

        // Build render options with sequence policy support
        const renderOptions: any = {};
        const hasPriorState = priorState && priorState.positions && priorState.positions.length > 0;
        const currentSequencePolicy = sequencePolicyNameRef.current;

        if (hasPriorState && currentSequencePolicy && currentSequencePolicy !== 'ignore_history') {
          // Use sequence policy API for inter-step continuity
          try {
            if (typeof core.getSequencePolicy === 'function') {
              const policy = core.getSequencePolicy(currentSequencePolicy);
              if (policy) {
                renderOptions.policy = policy;
                renderOptions.currInstance = alloyDataInstance;
                renderOptions.priorPositions = priorState;
                // prevInstance may be null on the first transition — that's OK,
                // the web component will still morph using priorPositions.
                if (prevInstanceRef.current) {
                  renderOptions.prevInstance = prevInstanceRef.current;
                }
              } else {
                // Policy lookup returned null/undefined — fall back to simple prior state
                renderOptions.priorPositions = priorState;
              }
            } else {
              // getSequencePolicy not available — fall back to simple prior state
              renderOptions.priorPositions = priorState;
            }
          } catch (err) {
            console.warn('[SpyTialGraph] Failed to get sequence policy:', err);
            // Fall back to simple prior state on error
            renderOptions.priorPositions = priorState;
          }
        } else if (hasPriorState) {
          // Fallback: simple prior state passing (ignore_history / no policy)
          renderOptions.priorPositions = priorState;
        }

        await graphElementRef.current.renderLayout(
          layoutResult.layout,
          Object.keys(renderOptions).length > 0 ? renderOptions : undefined
        );

        // Track the current instance for next step's sequence policy
        prevInstanceRef.current = alloyDataInstance;
      }

      setIsLoading(false);
    } catch (err: any) {
      console.error('Error rendering SpyTial graph:', err);
      setError(`Error rendering graph: ${err.message}`);
      setIsLoading(false);
    }
  }, [datum.data, datum.id, cndSpec, timeIndex, priorState]);

  // Create and mount the webcola-cnd-graph element once
  useEffect(() => {
    if (!graphContainerRef.current || isInitializedRef.current) return;

    // Create the webcola-cnd-graph custom element
    const graphElement = document.createElement('webcola-cnd-graph') as HTMLElementTagNameMap['webcola-cnd-graph'];
    graphElement.id = 'spytial-graph-container';
    graphElement.setAttribute('layoutFormat', 'default');
    graphElement.setAttribute('transition-mode', 'morph');
    graphElement.setAttribute('aria-label', 'Interactive graph visualization');
    graphElement.style.cssText = `
      width: 100%;
      height: 100%;
      min-height: 400px;
      display: block;
    `;

    // Listen for layout-complete event to capture FINAL layout state after WebCola constraints
    // This is crucial for temporal consistency - we want positions AFTER constraints are applied
    const handleLayoutComplete = (e: CustomEvent) => {
      //console.log('Layout complete! Capturing final layout state for temporal consistency.');
      
      // Use getLayoutState() to get complete state (positions + transform)
      if (graphElementRef.current?.getLayoutState && onLayoutStateChangeRef.current) {
        const layoutState = graphElementRef.current.getLayoutState();
        if (layoutState && layoutState.positions && layoutState.positions.length > 0) {
          // console.log(`Captured layout state: ${layoutState.positions.length} positions, transform: k=${layoutState.transform.k.toFixed(2)}`);
          onLayoutStateChangeRef.current(layoutState);
        }
      }
    };

    // Listen for node drag end to update layout state
    const handleNodeDragEnd = (e: CustomEvent) => {
      //console.log('Node drag ended, updating layout state');
      if (graphElementRef.current?.getLayoutState && onLayoutStateChangeRef.current) {
        const layoutState = graphElementRef.current.getLayoutState();
        if (layoutState && layoutState.positions && layoutState.positions.length > 0) {
          onLayoutStateChangeRef.current(layoutState);
        }
      }
    };

    // Listen for viewBox changes (zoom/pan) to update layout state
    const handleViewBoxChange = (e: CustomEvent) => {
      // When zoom/pan changes, update the full layout state (which includes transform)
      if (graphElementRef.current?.getLayoutState && onLayoutStateChangeRef.current) {
        const layoutState = graphElementRef.current.getLayoutState();
        if (layoutState && layoutState.positions && layoutState.positions.length > 0) {
          onLayoutStateChangeRef.current(layoutState);
        }
      }
    };

    graphElement.addEventListener('layout-complete', handleLayoutComplete as EventListener);
    graphElement.addEventListener('node-drag-end', handleNodeDragEnd as EventListener);
    graphElement.addEventListener('viewbox-change', handleViewBoxChange as EventListener);

    graphContainerRef.current.appendChild(graphElement);
    graphElementRef.current = graphElement;
    isInitializedRef.current = true;

    // Cleanup on unmount
    return () => {
      if (graphElementRef.current) {
        graphElementRef.current.removeEventListener('layout-complete', handleLayoutComplete as EventListener);
        graphElementRef.current.removeEventListener('node-drag-end', handleNodeDragEnd as EventListener);
        graphElementRef.current.removeEventListener('viewbox-change', handleViewBoxChange as EventListener);
        
        if (graphElementRef.current.clear) {
          graphElementRef.current.clear();
        }
        // Remove the element we added
        if (graphContainerRef.current && graphElementRef.current.parentNode === graphContainerRef.current) {
          graphContainerRef.current.removeChild(graphElementRef.current);
        }
      }
      graphElementRef.current = null;
      isInitializedRef.current = false;
    };
  }, []); // Only run once on mount

  // Load graph when datum, cndSpec, timeIndex changes, BUT only after CndCore is ready
  useEffect(() => {
    if (graphElementRef.current && isCndCoreReady) {
      loadGraph();
    }
  }, [datum.data, cndSpec, timeIndex, loadGraph, isCndCoreReady]);

  return (
    <div 
      className="absolute inset-0 flex flex-col"
      style={{ 
        background: 'white',
        overflow: 'hidden'
      }}
    >
      {/* This div is where we manually mount the custom element - React won't touch its children */}
      <div 
        ref={graphContainerRef} 
        style={{ 
          flex: 1,
          position: 'relative',
          minHeight: '400px',
          cursor: synthesisMode ? 'pointer' : 'default'
        }}
      />
      {/* React-managed overlay elements */}
      {isLoading && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75"
          style={{ zIndex: 10, pointerEvents: 'none' }}
        >
          <div className="text-gray-600">Loading graph...</div>
        </div>
      )}
      {error && (
        <div 
          className="absolute bottom-0 left-0 right-0 p-4 bg-red-100 border-t border-red-300 text-red-700"
          style={{ zIndex: 20 }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
};

export { SpyTialGraph };
