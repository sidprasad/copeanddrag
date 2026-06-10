import { DatumParsed } from '@/sterling-connection';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useMemo } from 'react';
import { parseCndFile, SequencePolicyName } from '../../utils/cndPreParser';
import { getSpytialCore, hasSpytialCore } from '../../utils/spytialCore';
import { useSterlingSelector } from '../../state/hooks';
import { selectColorMode } from '../../state/selectors';

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

interface MultiTemporalGraphProps {
  datum: DatumParsed<any>;
  cndSpec: string;
  /** Array of time indices to display */
  selectedTimeIndices: number[];
  /** Total number of time steps in the trace */
  traceLength: number;
  /** Sequence policy name from CND spec */
  sequencePolicyName?: SequencePolicyName;
}

interface SingleTemporalPaneProps {
  datum: DatumParsed<any>;
  cndSpec: string;
  timeIndex: number;
  traceLength: number;
  index: number;
  /** Sequence policy name from CND spec */
  sequencePolicyName?: SequencePolicyName;
}

/**
 * A single pane showing one time step
 */
const SingleTemporalPane = (props: SingleTemporalPaneProps) => {
  const { datum, cndSpec, timeIndex, traceLength, index, sequencePolicyName = 'stability' } = props;

  const colorMode = useSterlingSelector(selectColorMode);
  const colorModeRef = useRef(colorMode);
  colorModeRef.current = colorMode;
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const graphElementRef = useRef<HTMLElementTagNameMap['webcola-cnd-graph'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isInitializedRef = useRef(false);
  const layoutRef = useRef<any>(null);

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

      // Create AlloyDataInstance for THIS specific time index
      const instanceIndex = Math.min(timeIndex, alloyDatum.instances.length - 1);
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

      // Parse layout specification using pre-parser
      const parsedCnd = parseCndFile(cndSpec || '');
      let layoutSpec = null;
      try {
        layoutSpec = core.parseLayoutSpec(parsedCnd.layoutYaml);
      } catch (parseError: any) {
        console.error(`[Time ${timeIndex}] Layout spec parse error:`, parseError);
        layoutSpec = core.parseLayoutSpec('');
      }

      // Create LayoutInstance
      const ENABLE_ALIGNMENT_EDGES = true;
      const layoutInstance = new core.LayoutInstance(
        layoutSpec,
        sgraphEvaluator,
        instanceIndex, // Use the time index as instance number
        ENABLE_ALIGNMENT_EDGES
      );

      // Generate layout with single-arg API
      const layoutResult = layoutInstance.generateLayout(alloyDataInstance);

      if (layoutResult.error) {
        console.error(`[Time ${timeIndex}] Layout generation error:`, layoutResult.error);
        setError(`Layout error: ${layoutResult.error.message}`);
      }

      // Store the layout
      layoutRef.current = layoutResult.layout;

      // Render the layout
      if (graphElementRef.current && layoutResult.layout) {
        // Clear stale graph state (including leftover alignment edges) before
        // rendering the new layout, so nothing from the prior temporal step bleeds through.
        if (graphElementRef.current.clear) {
          graphElementRef.current.clear();
        }
        graphElementRef.current.setTheme?.(colorModeRef.current);
        await graphElementRef.current.renderLayout(layoutResult.layout);
      }

      setIsLoading(false);
    } catch (err: any) {
      console.error(`[Time ${timeIndex}] Error rendering graph:`, err);
      setError(`Error: ${err.message}`);
      setIsLoading(false);
    }
    // colorMode is intentionally NOT a dependency: theme switches re-tint in
    // place via setTheme (effect below) — a full clear()+renderLayout here
    // races spytial-core's WebCola ticks against nulled selections.
  }, [datum.data, datum.id, cndSpec, timeIndex, sequencePolicyName]);

  // Create and mount the webcola-cnd-graph element once.
  // useLayoutEffect so the cleanup detaches the element synchronously, ahead of
  // React removing the host DOM; the try/catch contains spytial-core's dispose
  // throw (getPointAtLength on an empty edge path) so it can't break unmount.
  useLayoutEffect(() => {
    if (!graphContainerRef.current || isInitializedRef.current) return;

    const graphElement = document.createElement('webcola-cnd-graph') as HTMLElementTagNameMap['webcola-cnd-graph'];
    graphElement.id = `spytial-graph-temporal-${index}`;
    graphElement.setAttribute('layoutFormat', 'default');
    graphElement.setAttribute('aria-label', `Graph visualization for time step ${timeIndex + 1}`);
    graphElement.setAttribute('theme', colorModeRef.current);
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
        try {
          graphElementRef.current.clear?.();
        } catch {
          /* ignore */
        }
        try {
          graphElementRef.current.remove();
        } catch {
          /* ignore spytial-core dispose throw */
        }
      }
      graphElementRef.current = null;
      layoutRef.current = null;
      isInitializedRef.current = false;
    };
  }, [index, timeIndex]);

  // Load graph when dependencies change
  useEffect(() => {
    if (graphElementRef.current && hasSpytialCore()) {
      loadGraph();
    }
  }, [datum.data, cndSpec, timeIndex, loadGraph]);

  // Theme switches re-tint the live graph in place (no re-layout).
  useEffect(() => {
    graphElementRef.current?.setTheme?.(colorMode);
  }, [colorMode]);

  return (
    <div className="relative flex flex-col border border-rule-strong rounded-lg overflow-hidden bg-surface shadow-sm">
      {/* Header with time step label */}
      <div className="px-3 py-2 bg-info-bg border-b border-info-border">
        <span className="font-medium text-sm text-info">
          State {timeIndex + 1} of {traceLength}
        </span>
      </div>

      {/* Graph container */}
      <div
        ref={graphContainerRef}
        className="flex-1"
        style={{
          minHeight: '250px',
          background: 'var(--ccd-surface)'
        }}
      />

      {/* Loading overlay */}
      {isLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ zIndex: 10, pointerEvents: 'none', background: 'var(--ccd-overlay)' }}
        >
          <div className="text-ink-muted text-sm">Loading...</div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="px-3 py-2 bg-danger-bg border-t border-danger-border text-danger text-xs">
          {error}
        </div>
      )}
    </div>
  );
};

/**
 * Component that renders multiple graphs in a grid, one for each selected time step
 */
const MultiTemporalGraph = (props: MultiTemporalGraphProps) => {
  const { datum, cndSpec, selectedTimeIndices, traceLength, sequencePolicyName } = props;
  
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

  // Calculate grid columns based on number of time steps
  const gridCols = useMemo(() => {
    const count = selectedTimeIndices.length;
    if (count <= 2) return count;
    if (count <= 4) return 2;
    if (count <= 6) return 3;
    return 4;
  }, [selectedTimeIndices.length]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-danger bg-danger-bg p-4 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  if (!isCndCoreReady) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-ink-muted">Loading CnD Core...</div>
      </div>
    );
  }

  if (selectedTimeIndices.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-ink-muted bg-surface-muted p-4 rounded-lg">
          No time steps selected.
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-auto bg-surface-sunken p-4">
      <div className="mb-4 px-2">
        <h2 className="text-lg font-semibold text-ink">
          Temporal Comparison
        </h2>
        <p className="text-sm text-ink-muted">
          Showing {selectedTimeIndices.length} time step{selectedTimeIndices.length !== 1 ? 's' : ''} of {traceLength}
        </p>
      </div>
      
      <div 
        className="grid gap-4"
        style={{ 
          gridTemplateColumns: `repeat(${gridCols}, minmax(300px, 1fr))`,
        }}
      >
        {selectedTimeIndices.map((timeIdx, index) => (
          <SingleTemporalPane
            key={`time-${timeIdx}`}
            datum={datum}
            cndSpec={cndSpec}
            timeIndex={timeIdx}
            traceLength={traceLength}
            index={index}
            sequencePolicyName={sequencePolicyName}
          />
        ))}
      </div>
    </div>
  );
};

export { MultiTemporalGraph };
export type { MultiTemporalGraphProps };
