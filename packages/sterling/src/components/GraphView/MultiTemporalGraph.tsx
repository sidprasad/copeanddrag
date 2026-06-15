import { DatumParsed } from '@/sterling-connection';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useMemo } from 'react';
import { parseCndFile, SequencePolicyName } from '../../utils/cndPreParser';
import { getSpytialCore, hasSpytialCore } from '../../utils/spytialCore';
import { useSterlingSelector } from '../../state/hooks';
import { selectColorMode } from '../../state/selectors';
import type { LayoutState } from './SpyTialGraph';

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
  /**
   * The current/anchor state index. When set (sliding-window mode), the other
   * panes apply the temporal policy relative to this state's layout so matching
   * nodes stay in place across the window. Undefined (compare mode) means every
   * pane is laid out independently.
   */
  anchorTimeIndex?: number;
}

interface SingleTemporalPaneProps {
  datum: DatumParsed<any>;
  cndSpec: string;
  timeIndex: number;
  traceLength: number;
  index: number;
  /** Sequence policy name from CND spec */
  sequencePolicyName?: SequencePolicyName;
  /** Apply the temporal policy, morphing this pane toward `priorState`. */
  applyContinuity?: boolean;
  /** The anchor (current) state's layout positions to continue from. */
  priorState?: LayoutState;
  /** The anchor state's trace index, used to build the policy's prevInstance. */
  prevTimeIndex?: number;
  /** Defer rendering until the anchor has reported its layout. */
  waitingForAnchor?: boolean;
  /** Anchor pane only: report its settled layout (or null on failure). */
  onLayoutStateChange?: (state: LayoutState | null) => void;
}

/**
 * A single pane showing one time step
 */
const SingleTemporalPane = (props: SingleTemporalPaneProps) => {
  const {
    datum,
    cndSpec,
    timeIndex,
    traceLength,
    index,
    sequencePolicyName = 'stability',
    applyContinuity = false,
    priorState,
    prevTimeIndex,
    waitingForAnchor = false,
    onLayoutStateChange
  } = props;

  const colorMode = useSterlingSelector(selectColorMode);
  const colorModeRef = useRef(colorMode);
  colorModeRef.current = colorMode;
  // Keep the report callback in a ref so loadGraph doesn't re-run when the
  // parent passes a fresh closure each render.
  const onLayoutStateChangeRef = useRef(onLayoutStateChange);
  onLayoutStateChangeRef.current = onLayoutStateChange;
  // Whether the anchor's settled positions have been reported for the current
  // render (set by the 'layout-complete' event; gates the timeout fallback).
  const anchorSettledRef = useRef(false);
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

    // Non-anchor panes hold (showing the loading overlay) until the anchor has
    // reported its layout, so they can morph toward it rather than flashing an
    // independent layout first.
    if (waitingForAnchor) {
      setIsLoading(true);
      return;
    }

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

        // In sliding-window mode the non-anchor panes morph toward the anchor
        // (current) state's positions via the sequence policy, so matching
        // nodes stay put across the window. Mirrors SpyTialGraph's single-state
        // continuity. Compare mode passes no continuity and lays out freely.
        const renderOptions: any = {};
        const hasPrior =
          applyContinuity &&
          priorState &&
          priorState.positions &&
          priorState.positions.length > 0;
        if (hasPrior && sequencePolicyName && sequencePolicyName !== 'ignore_history') {
          try {
            const policy = core.getSequencePolicy?.(sequencePolicyName);
            if (policy) {
              renderOptions.policy = policy;
              renderOptions.currInstance = alloyDataInstance;
              renderOptions.priorPositions = priorState;
              if (prevTimeIndex !== undefined) {
                const prevIdx = Math.min(prevTimeIndex, alloyDatum.instances.length - 1);
                renderOptions.prevInstance = new core.AlloyDataInstance(alloyDatum.instances[prevIdx]);
              }
            } else {
              renderOptions.priorPositions = priorState;
            }
          } catch (err) {
            console.warn('[MultiTemporalGraph] Failed to get sequence policy:', err);
            renderOptions.priorPositions = priorState;
          }
        }

        // Anchor pane: arm settled-position reporting before rendering. The
        // 'layout-complete' listener (added at element creation) captures the
        // positions AFTER WebCola settles — capturing right after renderLayout
        // resolves would hand followers pre-settle positions.
        if (onLayoutStateChangeRef.current) {
          anchorSettledRef.current = false;
        }

        await graphElementRef.current.renderLayout(
          layoutResult.layout,
          Object.keys(renderOptions).length > 0 ? renderOptions : undefined
        );
        // Re-fit the viewport to this time step's content. The graph otherwise
        // keeps the prior viewport once the user has zoomed/panned, leaving the
        // step framed by a stale view. (See SpyTialGraph for the full rationale.)
        graphElementRef.current.resetViewToFitContent?.();

        // Fallback: if 'layout-complete' never fires, still report (slightly
        // pre-settle) positions so followers don't wait forever.
        if (onLayoutStateChangeRef.current) {
          const el = graphElementRef.current;
          setTimeout(() => {
            if (!anchorSettledRef.current && onLayoutStateChangeRef.current && el?.getLayoutState) {
              const s = el.getLayoutState();
              onLayoutStateChangeRef.current(
                s && s.positions && s.positions.length > 0 ? s : null
              );
            }
          }, 1500);
        }
      }

      setIsLoading(false);
    } catch (err: any) {
      console.error(`[Time ${timeIndex}] Error rendering graph:`, err);
      setError(`Error: ${err.message}`);
      setIsLoading(false);
      // If the anchor fails, unblock the other panes so they render without
      // continuity rather than waiting on a layout that will never arrive.
      onLayoutStateChangeRef.current?.(null);
    }
    // colorMode is intentionally NOT a dependency: theme switches re-tint in
    // place via setTheme (effect below) — a full clear()+renderLayout here
    // races spytial-core's WebCola ticks against nulled selections.
  }, [
    datum.data,
    datum.id,
    cndSpec,
    timeIndex,
    sequencePolicyName,
    applyContinuity,
    priorState,
    prevTimeIndex,
    waitingForAnchor
  ]);

  // Create and mount the webcola-cnd-graph element once.
  // useLayoutEffect so the cleanup detaches the element synchronously, ahead of
  // React removing the host DOM. spytial-core >=2.8.1 makes disconnectedCallback
  // teardown safe (no throw on dispose), so no try/catch guard is needed.
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

    // Anchor pane only (others leave onLayoutStateChange undefined): capture the
    // FINAL positions once WebCola settles and hand them to the follower panes.
    const handleLayoutComplete = () => {
      if (onLayoutStateChangeRef.current && graphElementRef.current?.getLayoutState) {
        const s = graphElementRef.current.getLayoutState();
        if (s && s.positions && s.positions.length > 0) {
          anchorSettledRef.current = true;
          onLayoutStateChangeRef.current(s);
        }
      }
    };
    graphElement.addEventListener('layout-complete', handleLayoutComplete as EventListener);

    return () => {
      graphElement.removeEventListener('layout-complete', handleLayoutComplete as EventListener);
      if (graphElementRef.current) {
        graphElementRef.current.clear?.();
        graphElementRef.current.remove();
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
  const { datum, cndSpec, selectedTimeIndices, traceLength, sequencePolicyName, anchorTimeIndex } = props;

  const [isCndCoreReady, setIsCndCoreReady] = useState(hasSpytialCore());
  const [error, setError] = useState<string | null>(null);

  // Sliding-window continuity: the pane for `anchorTimeIndex` (the current
  // state) lays out fresh and reports its positions; the others wait for it and
  // morph toward it via the temporal policy. Only active when an anchor is
  // present, a real policy is set, and the anchor is one of the shown panes
  // (compare mode passes no anchor, so panes stay independent).
  const continuityActive =
    anchorTimeIndex !== undefined &&
    !!sequencePolicyName &&
    sequencePolicyName !== 'ignore_history' &&
    selectedTimeIndices.includes(anchorTimeIndex);

  const [anchorResult, setAnchorResult] = useState<{
    resolved: boolean;
    state: LayoutState | null;
  }>({ resolved: false, state: null });
  const reportAnchor = useCallback(
    (state: LayoutState | null) => setAnchorResult({ resolved: true, state }),
    []
  );

  // Re-anchor whenever the window, policy, or spec changes (e.g. scrubbing
  // shifts the window) so panes never continue from stale positions.
  const windowKey = `${datum.id}|${cndSpec}|${sequencePolicyName ?? ''}|${anchorTimeIndex ?? ''}|${selectedTimeIndices.join(',')}`;
  useEffect(() => {
    setAnchorResult({ resolved: false, state: null });
  }, [windowKey]);

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
        {selectedTimeIndices.map((timeIdx, index) => {
          const isAnchor = continuityActive && timeIdx === anchorTimeIndex;
          const isFollower = continuityActive && !isAnchor;
          return (
            <SingleTemporalPane
              key={`time-${timeIdx}`}
              datum={datum}
              cndSpec={cndSpec}
              timeIndex={timeIdx}
              traceLength={traceLength}
              index={index}
              sequencePolicyName={sequencePolicyName}
              applyContinuity={isFollower}
              priorState={isFollower ? anchorResult.state ?? undefined : undefined}
              prevTimeIndex={isFollower ? anchorTimeIndex : undefined}
              waitingForAnchor={isFollower && !anchorResult.resolved}
              onLayoutStateChange={isAnchor ? reportAnchor : undefined}
            />
          );
        })}
      </div>
    </div>
  );
};

export { MultiTemporalGraph };
export type { MultiTemporalGraphProps };
