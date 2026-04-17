import { Pane, PaneBody, PaneHeader, PaneTitle } from '@/sterling-ui';
import { useCallback, useRef, useState } from 'react';
import { useSterlingSelector } from '../../state/hooks';
import {
  selectActiveDatum,
  selectCnDSpec,
  selectTimeIndex,
  selectProjectionConfig,
  selectSequencePolicyName
} from '../../state/selectors';
import { SpyTialEditGraph } from './SpyTialEditGraph';
import type { LayoutState } from '../GraphView/SpyTialGraph';
import { getSpytialCore } from '../../utils/spytialCore';
import { validateEditedInstance, ValidationIssue } from '../../utils/instanceValidation';

const EditView = () => {
  const datum = useSterlingSelector(selectActiveDatum);
  const cndSpec = useSterlingSelector((state) =>
    datum ? selectCnDSpec(state, datum) : ''
  );
  const timeIndex = useSterlingSelector((state) =>
    datum ? selectTimeIndex(state, datum) : 0
  );
  const projectionConfig = useSterlingSelector((state) =>
    datum ? selectProjectionConfig(state, datum) : []
  ) || [];
  const sequencePolicyName = useSterlingSelector((state) =>
    datum ? selectSequencePolicyName(state, datum) : undefined
  );

  const layoutStateRef = useRef<LayoutState | undefined>(undefined);
  const graphElementRef = useRef<HTMLElementTagNameMap['structured-input-graph'] | null>(null);

  type ExportFeedback =
    | { status: 'success'; message: string }
    | { status: 'warning'; message: string; issues: ValidationIssue[] }
    | { status: 'error'; message: string; issues: ValidationIssue[] };

  const [exportFeedback, setExportFeedback] = useState<ExportFeedback | null>(null);
  const [showIssueDetails, setShowIssueDetails] = useState(false);

  const handleLayoutStateChange = useCallback((state: LayoutState) => {
    layoutStateRef.current = state;
  }, []);

  const copyAndValidate = useCallback((data: string) => {
    const el = graphElementRef.current;
    const dataInstance = el?.getDataInstance?.();
    const core = getSpytialCore();

    // Run validation if we have the data instance and original schema
    let validation: { errors: ValidationIssue[]; warnings: ValidationIssue[] } | null = null;
    if (dataInstance && datum?.data && core) {
      try {
        const alloyDatum = core.AlloyInstance.parseAlloyXML(datum.data);
        if (alloyDatum.instances && alloyDatum.instances.length > 0) {
          const instanceIndex = timeIndex !== undefined
            ? Math.min(timeIndex, alloyDatum.instances.length - 1)
            : 0;
          validation = validateEditedInstance(dataInstance, alloyDatum.instances[instanceIndex]);
        }
      } catch (err) {
        console.warn('Validation failed, skipping:', err);
      }
    }

    // Always copy to clipboard
    navigator.clipboard.writeText(data).then(() => {
      if (validation && validation.errors.length > 0) {
        setExportFeedback({
          status: 'error',
          message: `Copied, but found ${validation.errors.length} error(s)`,
          issues: [...validation.errors, ...validation.warnings],
        });
        setShowIssueDetails(true);
      } else if (validation && validation.warnings.length > 0) {
        setExportFeedback({
          status: 'warning',
          message: `Copied with ${validation.warnings.length} warning(s)`,
          issues: validation.warnings,
        });
        setShowIssueDetails(true);
        setTimeout(() => setExportFeedback(null), 8000);
      } else {
        setExportFeedback({ status: 'success', message: 'Copied to clipboard!' });
        setShowIssueDetails(false);
        setTimeout(() => setExportFeedback(null), 2000);
      }
    }).catch((err) => {
      console.error('Failed to copy to clipboard:', err);
      setExportFeedback({ status: 'error', message: 'Failed to copy', issues: [] });
      setTimeout(() => setExportFeedback(null), 2000);
    });
  }, [datum, timeIndex]);

  const handleDataExported = useCallback((data: string, _format: string, _reified: unknown) => {
    copyAndValidate(data);
  }, [copyAndValidate]);

  const handleExport = useCallback(() => {
    const el = graphElementRef.current;
    const dataInstance = el?.getDataInstance?.();
    if (dataInstance && typeof dataInstance.reify === 'function') {
      const reified = dataInstance.reify();
      const exportString = typeof reified === 'string'
        ? reified
        : JSON.stringify(reified, null, 2);
      handleDataExported(exportString, typeof reified === 'string' ? 'text' : 'json', reified);
    }
  }, [handleDataExported]);

  const handleLoadFromInstance = useCallback(() => {
    if (!datum?.data || !graphElementRef.current) return;

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
        // setDataInstance only assigns the field — trigger layout explicitly
        const el = graphElementRef.current as any;
        if (typeof el.enforceConstraintsAndRegenerate === 'function') {
          el.enforceConstraintsAndRegenerate();
        }
      }
    } catch (err: any) {
      console.error('Failed to load instance:', err);
    }
  }, [datum, timeIndex]);

  return (
    <Pane className='grid grid-flow-col divide-x divide-dashed'>
      <div className='relative'>
        <Pane>
          <PaneHeader className='border-b'>
            <div className='w-full flex items-center px-2 space-x-2'>
              <PaneTitle className='text-gray-400'>Edit</PaneTitle>
              {datum && (
                <PaneTitle>{datum.parsed.command}</PaneTitle>
              )}
              <div className='grow' />
              {datum && (
                <button
                  type="button"
                  onClick={handleLoadFromInstance}
                  className="px-3 py-1 text-xs font-medium rounded border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-400 transition"
                >
                  Load from Instance
                </button>
              )}
              <button
                type="button"
                onClick={handleExport}
                className="px-3 py-1 text-xs font-medium rounded bg-indigo-600 text-white hover:bg-indigo-500 transition"
              >
                Export as inst
              </button>
              {exportFeedback?.status === 'success' && (
                <span className="text-xs text-green-600 font-medium">
                  {exportFeedback.message}
                </span>
              )}
            </div>
          </PaneHeader>
          <div className="px-3 py-1.5 bg-amber-50 border-b border-amber-200 text-amber-700 text-xs">
            Experimental feature — Edit mode is under active development.
          </div>
          {exportFeedback && exportFeedback.status !== 'success' && (
            <div className={`px-3 py-2 border-b text-xs ${
              exportFeedback.status === 'error'
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-medium">{exportFeedback.message}</span>
                <div className="flex items-center space-x-2">
                  {exportFeedback.issues.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowIssueDetails(!showIssueDetails)}
                      className="underline hover:no-underline"
                    >
                      {showIssueDetails ? 'Hide' : 'Details'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => { setExportFeedback(null); setShowIssueDetails(false); }}
                    className="hover:opacity-70"
                  >
                    ✕
                  </button>
                </div>
              </div>
              {showIssueDetails && exportFeedback.issues.length > 0 && (
                <ul className="mt-1.5 space-y-0.5 list-disc list-inside">
                  {exportFeedback.issues.map((issue, idx) => (
                    <li key={idx}>
                      <span className={issue.severity === 'error' ? 'text-red-600' : 'text-amber-600'}>
                        {issue.message}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <PaneBody>
            <SpyTialEditGraph
              datum={datum}
              cndSpec={cndSpec}
              timeIndex={timeIndex}
              priorState={layoutStateRef.current}
              onLayoutStateChange={handleLayoutStateChange}
              projectionConfig={projectionConfig}
              sequencePolicyName={sequencePolicyName}
              onDataExported={handleDataExported}
              graphElementRef={graphElementRef}
            />
          </PaneBody>
        </Pane>
      </div>
    </Pane>
  );
};

export { EditView };
