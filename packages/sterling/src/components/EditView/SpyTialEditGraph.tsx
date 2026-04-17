import { DatumParsed } from '@/sterling-connection';
import { useCallback, useEffect, useRef, useState } from 'react';
import { parseCndFile, type CndProjection, type SequencePolicyName } from '../../utils/cndPreParser';
import { getSpytialCore, hasSpytialCore } from '../../utils/spytialCore';
import type { LayoutState, TransformInfo, NodePositionHint } from '../GraphView/SpyTialGraph';

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

const SpyTialEditGraph = (props: SpyTialEditGraphProps) => {
  const {
    datum,
    cndSpec,
    timeIndex,
    priorState,
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
  const isInitializedRef = useRef(false);

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

  // Apply CnD spec to the structured-input-graph element
  const applyCndSpec = useCallback(() => {
    if (!graphElementRef.current || !isCndCoreReady) return;

    if (cndSpec) {
      const parsedCnd = parseCndFile(cndSpec);
      graphElementRef.current.setAttribute('cnd-spec', parsedCnd.layoutYaml);
    }
    setIsLoading(false);
  }, [cndSpec, isCndCoreReady]);

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

    // Listen for layout-complete event for temporal continuity
    const handleLayoutComplete = () => {
      if (graphElementRef.current?.getLayoutState && onLayoutStateChangeRef.current) {
        const layoutState = graphElementRef.current.getLayoutState();
        if (layoutState && layoutState.positions && layoutState.positions.length > 0) {
          onLayoutStateChangeRef.current(layoutState);
        }
      }
    };

    const handleNodeDragEnd = () => {
      if (graphElementRef.current?.getLayoutState && onLayoutStateChangeRef.current) {
        const layoutState = graphElementRef.current.getLayoutState();
        if (layoutState && layoutState.positions && layoutState.positions.length > 0) {
          onLayoutStateChangeRef.current(layoutState);
        }
      }
    };

    const handleViewBoxChange = () => {
      if (graphElementRef.current?.getLayoutState && onLayoutStateChangeRef.current) {
        const layoutState = graphElementRef.current.getLayoutState();
        if (layoutState && layoutState.positions && layoutState.positions.length > 0) {
          onLayoutStateChangeRef.current(layoutState);
        }
      }
    };

    // Listen for data-exported events from the structured-input-graph
    const handleDataExported = (e: CustomEvent) => {
      if (onDataExportedRef.current) {
        onDataExportedRef.current(e.detail.data, e.detail.format, e.detail.reified);
      }
    };

    graphElement.addEventListener('layout-complete', handleLayoutComplete as EventListener);
    graphElement.addEventListener('node-drag-end', handleNodeDragEnd as EventListener);
    graphElement.addEventListener('viewbox-change', handleViewBoxChange as EventListener);
    graphElement.addEventListener('data-exported', handleDataExported as EventListener);

    graphContainerRef.current.appendChild(graphElement);
    graphElementRef.current = graphElement;
    if (externalGraphRef) {
      externalGraphRef.current = graphElement;
    }
    isInitializedRef.current = true;

    return () => {
      if (graphElementRef.current) {
        graphElementRef.current.removeEventListener('layout-complete', handleLayoutComplete as EventListener);
        graphElementRef.current.removeEventListener('node-drag-end', handleNodeDragEnd as EventListener);
        graphElementRef.current.removeEventListener('viewbox-change', handleViewBoxChange as EventListener);
        graphElementRef.current.removeEventListener('data-exported', handleDataExported as EventListener);

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
    };
  }, []);

  // Apply CnD spec when it changes and core is ready
  useEffect(() => {
    if (graphElementRef.current && isCndCoreReady) {
      applyCndSpec();
    }
  }, [cndSpec, applyCndSpec, isCndCoreReady]);

  // Auto-load instance from datum after CnD spec is applied so the graph
  // starts with the correct schema (avoiding arity errors from empty instances)
  useEffect(() => {
    if (!graphElementRef.current || !isCndCoreReady || isLoading) return;
    if (!datum?.data) return;

    const core = getSpytialCore();
    if (!core) return;

    try {
      const alloyDatum = core.AlloyInstance.parseAlloyXML(datum.data);
      if (!alloyDatum.instances || alloyDatum.instances.length === 0) return;

      const instanceIndex = timeIndex !== undefined
        ? Math.min(timeIndex, alloyDatum.instances.length - 1)
        : 0;
      const alloyDataInstance = new core.AlloyDataInstance(alloyDatum.instances[instanceIndex]);

      if (graphElementRef.current.setDataInstance) {
        graphElementRef.current.setDataInstance(alloyDataInstance);
        const el = graphElementRef.current as any;
        if (typeof el.enforceConstraintsAndRegenerate === 'function') {
          el.enforceConstraintsAndRegenerate();
        }
      }
    } catch (err: any) {
      console.error('Failed to auto-load instance:', err);
    }
  }, [datum, timeIndex, isCndCoreReady, isLoading]);

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
        <div
          className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75"
          style={{ zIndex: 10, pointerEvents: 'none' }}
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
};

export { SpyTialEditGraph };
