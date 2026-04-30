import { DatumParsed } from '@/sterling-connection';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { parseCndFile, type CndProjection, type SequencePolicyName } from '../../utils/cndPreParser';
import { getSpytialCore, hasSpytialCore } from '../../utils/spytialCore';
import type { LayoutState } from '../GraphView/SpyTialGraph';

// Extend HTMLElementTagNameMap for the structured-input-graph custom element
declare global {
  interface HTMLElementTagNameMap {
    'structured-input-graph': HTMLElement & {
      renderLayout: (layout: any, options?: {
        policy?: { readonly name: string; apply: (context: any) => any };
        prevInstance?: any;
        currInstance?: any;
        priorPositions?: LayoutState;
      }) => Promise<void>;
      getLayoutState?: () => LayoutState;
      addToolbarControl?: (element: HTMLElement) => void;
      clear?: () => void;
      setDataInstance?: (instance: any) => void;
      getDataInstance?: () => any;
      getCurrentConstraintError?: () => any;
      hasConstraintErrors?: () => boolean;
      getAvailableTypes?: () => string[];
      setCnDSpec?: (spec: string) => Promise<void>;
      // TS-private in spytial-core beta.2 but still accessible at runtime;
      // no public alternative exists for triggering the CnD pipeline after setDataInstance.
      enforceConstraintsAndRegenerate?: () => Promise<void>;
      clearNodeHighlights?: () => void;
      highlightNodes?: (nodeIds: string[], color?: string) => boolean;
    };
  }
}

interface SpyTialEditGraphProps {
  datum: DatumParsed<any> | null | undefined;
  cndSpec: string;
  /** Index of the current time step in a temporal trace */
  timeIndex?: number;
  /** Callback to share layout state with parent for cross-frame continuity */
  onLayoutStateChange?: (state: LayoutState) => void;
  /** Prior layout state from previous frame for temporal continuity */
  priorState?: LayoutState;
  /** CND-derived projection configuration */
  projectionConfig?: CndProjection[];
  /** CND-derived sequence policy name */
  sequencePolicyName?: SequencePolicyName;
  /** User's current projection atom selections (type → atom ID) */
  projectionSelections?: Record<string, string>;
  /** Callback when data is exported via reify() */
  onDataExported?: (data: string, format: string, reified: unknown) => void;
  /** Ref callback to expose the graph element for external control */
  graphElementRef?: React.MutableRefObject<HTMLElementTagNameMap['structured-input-graph'] | null>;
}

export interface SpyTialEditGraphHandle {
  /** Force a reload from the current datum, discarding any in-editor edits */
  reloadFromInstance: () => Promise<void>;
}

const SpyTialEditGraph = forwardRef<SpyTialEditGraphHandle, SpyTialEditGraphProps>((props, ref) => {
  const {
    datum,
    cndSpec,
    timeIndex,
    onLayoutStateChange,
    projectionConfig = [],
    sequencePolicyName = 'ignore_history',
    projectionSelections = {},
    onDataExported,
    graphElementRef: externalGraphRef,
  } = props;

  const graphContainerRef = useRef<HTMLDivElement>(null);
  const graphElementRef = useRef<HTMLElementTagNameMap['structured-input-graph'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCndCoreReady, setIsCndCoreReady] = useState(hasSpytialCore());
  // Flips true once the structured-input-graph element is mounted into the
  // DOM. The bootstrap effect depends on this so it runs AFTER the mount
  // effect has populated graphElementRef.current — without it, effects
  // fire in declaration order and bootstrap would see a null ref.
  const [graphMounted, setGraphMounted] = useState(false);
  const isInitializedRef = useRef(false);

  // Tracks the last (datum.id, timeIndex) pair we successfully loaded into the
  // editor. The bootstrap effect skips reloading the data instance when the
  // key is unchanged, so a parent re-render with a fresh-but-equivalent datum
  // reference will not wipe the user's in-editor edits.
  const lastLoadedKeyRef = useRef<string | null>(null);

  // Monotonic ID for each bootstrap run. Used to ignore stale completions
  // when a new bootstrap starts before the previous one resolves.
  const bootstrapRunIdRef = useRef(0);

  // Refs for props that shouldn't trigger re-layout
  const projectionConfigRef = useRef(projectionConfig);
  projectionConfigRef.current = projectionConfig;
  const sequencePolicyNameRef = useRef(sequencePolicyName);
  sequencePolicyNameRef.current = sequencePolicyName;
  const projectionSelectionsRef = useRef(projectionSelections);
  projectionSelectionsRef.current = projectionSelections;
  const onLayoutStateChangeRef = useRef(onLayoutStateChange);
  onLayoutStateChangeRef.current = onLayoutStateChange;
  const onDataExportedRef = useRef(onDataExported);
  onDataExportedRef.current = onDataExported;

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
          setError('CnD Core library failed to load. Please refresh the page.');
          setIsLoading(false);
        }
      }
    }, 100);

    return () => clearInterval(intervalId);
  }, [isCndCoreReady]);

  // Single serialized bootstrap: apply spec, then load data, then render —
  // each step awaited so the next never starts before the previous finishes.
  const runBootstrap = useCallback(async (force: boolean) => {
    const el = graphElementRef.current;
    if (!el || !isCndCoreReady) return;

    const runId = ++bootstrapRunIdRef.current;
    const isCurrentRun = () => runId === bootstrapRunIdRef.current;

    setIsLoading(true);
    setError(null);

    try {
      // 1. Apply the CnD spec. Use the public Promise-returning method so
      // we can await pipeline initialization. Older spytial-core versions
      // only expose the attribute path; fall back with a warning.
      if (cndSpec) {
        const parsedCnd = parseCndFile(cndSpec);
        if (typeof el.setCnDSpec === 'function') {
          await el.setCnDSpec(parsedCnd.layoutYaml);
        } else {
          console.warn(
            '[SpyTialEditGraph] structured-input-graph.setCnDSpec missing; ' +
            'falling back to setAttribute. Pipeline init may race with data load.'
          );
          el.setAttribute('cnd-spec', parsedCnd.layoutYaml);
        }
      }
      if (!isCurrentRun()) return;

      // 2. Load the data instance, but only when the (datum.id, timeIndex)
      // pair has actually changed since our last load — otherwise we'd
      // overwrite any in-editor edits the user has made.
      const loadKey = `${datum?.id ?? ''}::${timeIndex ?? 0}`;
      const shouldLoad = force || loadKey !== lastLoadedKeyRef.current;

      if (shouldLoad && datum?.data) {
        const core = getSpytialCore();
        if (!core) throw new Error('spytial-core unavailable');

        const alloyDatum = core.AlloyInstance.parseAlloyXML(datum.data);
        if (alloyDatum.instances && alloyDatum.instances.length > 0) {
          const instanceIndex = timeIndex !== undefined
            ? Math.min(timeIndex, alloyDatum.instances.length - 1)
            : 0;
          const alloyDataInstance = new core.AlloyDataInstance(alloyDatum.instances[instanceIndex]);

          if (el.setDataInstance) {
            el.setDataInstance(alloyDataInstance);
            if (typeof el.enforceConstraintsAndRegenerate === 'function') {
              await el.enforceConstraintsAndRegenerate();
            }
          }
          if (!isCurrentRun()) return;
          lastLoadedKeyRef.current = loadKey;
        }
      }

      if (isCurrentRun()) setIsLoading(false);
    } catch (err: any) {
      if (!isCurrentRun()) return;
      console.error('[SpyTialEditGraph] bootstrap failed:', err);
      setError(err?.message ?? 'Failed to load editor');
      setIsLoading(false);
    }
  }, [cndSpec, datum?.id, datum?.data, timeIndex, isCndCoreReady]);

  // Run bootstrap when its inputs change. We deliberately key on datum.id
  // (a stable string) rather than the datum object so a Redux selector
  // returning a fresh-but-equivalent reference doesn't trigger a reload.
  // graphMounted gates the first run until the mount effect has populated
  // graphElementRef.current.
  useEffect(() => {
    if (!graphMounted || !graphElementRef.current || !isCndCoreReady) return;
    runBootstrap(false);
  }, [runBootstrap, isCndCoreReady, graphMounted]);

  useImperativeHandle(ref, () => ({
    reloadFromInstance: async () => {
      lastLoadedKeyRef.current = null;
      await runBootstrap(true);
    },
  }), [runBootstrap]);

  // Create and mount the structured-input-graph element once
  useEffect(() => {
    if (!graphContainerRef.current || isInitializedRef.current) return;

    const graphElement = document.createElement('structured-input-graph') as HTMLElementTagNameMap['structured-input-graph'];
    graphElement.id = 'spytial-edit-graph-container';
    graphElement.setAttribute('layoutFormat', 'default');
    graphElement.setAttribute('show-export', 'false'); // We handle export ourselves
    graphElement.setAttribute('aria-label', 'Interactive graph editor');
    graphElement.style.cssText = `
      width: 100%;
      height: 100%;
      min-height: 400px;
      display: block;
    `;

    const captureLayoutState = () => {
      if (graphElementRef.current?.getLayoutState && onLayoutStateChangeRef.current) {
        const layoutState = graphElementRef.current.getLayoutState();
        if (layoutState && layoutState.positions && layoutState.positions.length > 0) {
          onLayoutStateChangeRef.current(layoutState);
        }
      }
    };

    const handleLayoutComplete = () => captureLayoutState();
    const handleNodeDragEnd = () => captureLayoutState();
    const handleViewBoxChange = () => captureLayoutState();

    const handleDataExported = (e: Event) => {
      const ce = e as CustomEvent;
      if (onDataExportedRef.current) {
        onDataExportedRef.current(ce.detail.data, ce.detail.format, ce.detail.reified);
      }
    };

    // The user just made an edit inside the custom element. Pin the load key
    // to the current (datum, timeIndex) so that any subsequent re-render of
    // the bootstrap effect treats the data instance as already-loaded and
    // does NOT overwrite the user's edits.
    const handleEdited = () => {
      lastLoadedKeyRef.current = `${datum?.id ?? ''}::${timeIndex ?? 0}`;
      setError(null);
    };

    const handleConstraintError = (e: Event) => {
      const ce = e as CustomEvent;
      const msg = ce.detail?.error?.message
        ?? ce.detail?.message
        ?? 'Constraint conflict in edited instance';
      setError(msg);
    };

    const handleLayoutGenerationError = (e: Event) => {
      const ce = e as CustomEvent;
      const msg = ce.detail?.error?.message
        ?? ce.detail?.message
        ?? 'Layout generation failed';
      setError(msg);
    };

    const handleConstraintsSatisfied = () => setError(null);

    graphElement.addEventListener('layout-complete', handleLayoutComplete as EventListener);
    graphElement.addEventListener('node-drag-end', handleNodeDragEnd as EventListener);
    graphElement.addEventListener('viewbox-change', handleViewBoxChange as EventListener);
    graphElement.addEventListener('data-exported', handleDataExported as EventListener);
    graphElement.addEventListener('atom-added', handleEdited as EventListener);
    graphElement.addEventListener('atom-deleted', handleEdited as EventListener);
    graphElement.addEventListener('relation-added', handleEdited as EventListener);
    graphElement.addEventListener('constraint-error', handleConstraintError as EventListener);
    graphElement.addEventListener('layout-generation-error', handleLayoutGenerationError as EventListener);
    graphElement.addEventListener('constraints-satisfied', handleConstraintsSatisfied as EventListener);

    graphContainerRef.current.appendChild(graphElement);
    graphElementRef.current = graphElement;
    if (externalGraphRef) {
      externalGraphRef.current = graphElement;
    }
    isInitializedRef.current = true;
    setGraphMounted(true);

    return () => {
      if (graphElementRef.current) {
        graphElementRef.current.removeEventListener('layout-complete', handleLayoutComplete as EventListener);
        graphElementRef.current.removeEventListener('node-drag-end', handleNodeDragEnd as EventListener);
        graphElementRef.current.removeEventListener('viewbox-change', handleViewBoxChange as EventListener);
        graphElementRef.current.removeEventListener('data-exported', handleDataExported as EventListener);
        graphElementRef.current.removeEventListener('atom-added', handleEdited as EventListener);
        graphElementRef.current.removeEventListener('atom-deleted', handleEdited as EventListener);
        graphElementRef.current.removeEventListener('relation-added', handleEdited as EventListener);
        graphElementRef.current.removeEventListener('constraint-error', handleConstraintError as EventListener);
        graphElementRef.current.removeEventListener('layout-generation-error', handleLayoutGenerationError as EventListener);
        graphElementRef.current.removeEventListener('constraints-satisfied', handleConstraintsSatisfied as EventListener);

        if (graphElementRef.current.clear) {
          graphElementRef.current.clear();
        }
        if (graphContainerRef.current && graphElementRef.current.parentNode === graphContainerRef.current) {
          graphContainerRef.current.removeChild(graphElementRef.current);
        }
      }
      graphElementRef.current = null;
      if (externalGraphRef) {
        externalGraphRef.current = null;
      }
      isInitializedRef.current = false;
      setGraphMounted(false);
    };
    // The handlers close over `datum?.id` and `timeIndex` for the load-key
    // refresh, but the listener set is only re-bound on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="absolute inset-0 flex flex-col"
      style={{
        background: 'white',
        overflow: 'hidden'
      }}
    >
      <div
        ref={graphContainerRef}
        style={{
          flex: 1,
          position: 'relative',
          minHeight: '400px',
        }}
      />
      {isLoading && (
        // pointerEvents: 'auto' so the overlay swallows clicks on the
        // toolbar inside the custom element while the CnD pipeline
        // initializes — prevents add/delete from triggering the silent
        // no-op render path before layoutInstance/currentLayout exist.
        <div
          className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75"
          style={{ zIndex: 10, pointerEvents: 'auto' }}
        >
          <div className="text-gray-600">Loading editor...</div>
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
});

SpyTialEditGraph.displayName = 'SpyTialEditGraph';

export { SpyTialEditGraph };
