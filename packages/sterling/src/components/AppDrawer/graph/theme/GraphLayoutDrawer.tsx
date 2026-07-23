import { PaneTitle } from '@/sterling-ui';
import { useDisclosure } from '@chakra-ui/react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CndLayoutInterface } from 'spytial-core/react';
import 'spytial-core/react.css';
import { useSterlingDispatch, useSterlingSelector } from '../../../../state/hooks';
import {
  selectActiveDatum,
  selectCnDDraftSpec,
  selectColorMode,
  selectSelectedProjections,
  selectTimeIndex
} from '../../../../state/selectors';
import { cndDraftSpecSet, cndSpecSet, selectedProjectionsSet } from '../../../../state/graphs/graphsSlice';
import { parseCndFile } from '../../../../utils/cndPreParser';
import { getSpytialCore } from '../../../../utils/spytialCore';
import { resolveValidatedLayout, suggestAlloyLayout, validateCndSpecWithSpytial } from '../../../../utils/layoutSuggestions';
import type { CndPatch, LayoutValidationResult } from '../../../../utils/layoutSuggestions';
import { createFetchProvider, mergeSpecWithPatch, translateLayoutIntent } from '../../../../nlAuthoring';
import type { LlmMessage, LlmProviderConfig, NlProgressEvent } from '../../../../nlAuthoring';
import { DescribeLayoutModal } from './DescribeLayoutModal';

const GraphLayoutDrawer = () => {
  const dispatch = useSterlingDispatch();
  const datum = useSterlingSelector(selectActiveDatum);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const colorMode = useSterlingSelector(selectColorMode);
  const selectedProjections = useSterlingSelector((state) =>
    datum ? selectSelectedProjections(state, datum) : {}
  );
  const timeIndex = useSterlingSelector((state) =>
    datum ? selectTimeIndex(state, datum) : 0
  );

  // The live editing draft — the single source of truth for the editor. It is
  // the full `.cnd` (constraints/directives AND projections/temporal): the
  // editor round-trips the unknown top-level sections via spytial-core's
  // `otherSections`, so there is no strip/merge on the host side anymore.
  // Falls back to the applied spec. New data already seeds that applied spec
  // with the default directive, while an explicitly empty draft remains empty.
  const draftSpec = useSterlingSelector((state) =>
    datum ? selectCnDDraftSpec(state, datum) : ''
  );

  // Latest editor value, read at call time by the NL callbacks below — mirrors
  // the old `window.getCurrentCNDSpecFromReact()` "always current" read without
  // rebuilding those callbacks on every keystroke.
  const latestSpecRef = useRef(draftSpec);
  latestSpecRef.current = draftSpec;

  // Clear any stale suggestion error when the active datum changes.
  useEffect(() => {
    setSuggestionError(null);
  }, [datum?.id]);

  // Build the data instance handed to the editor for domain awareness
  // (type/relation dropdowns + selector autocomplete). Replaces the old
  // `window.updateInstanceFromReact(...)` push; tracks the datum + time step.
  const dataInstance = useMemo(() => {
    const xml = datum?.data;
    if (!xml) return undefined;
    const core = getSpytialCore();
    if (!core?.AlloyInstance?.parseAlloyXML || !core.AlloyDataInstance) return undefined;
    try {
      const alloyDatum = core.AlloyInstance.parseAlloyXML(xml);
      if (!alloyDatum.instances || alloyDatum.instances.length === 0) return undefined;
      const instanceIndex = Math.min(timeIndex, alloyDatum.instances.length - 1);
      return new core.AlloyDataInstance(alloyDatum.instances[instanceIndex]);
    } catch (err) {
      console.error('Failed to build data instance for spec editor:', err);
      return undefined;
    }
  }, [datum?.data, timeIndex]);

  const refreshProjectionData = useCallback((specText: string) => {
    if (!datum?.data) return;
    const core = getSpytialCore();
    if (!core?.AlloyInstance?.parseAlloyXML || !core.AlloyDataInstance) return;

    try {
      const alloyDatum = core.AlloyInstance.parseAlloyXML(datum.data);
      if (!alloyDatum.instances || alloyDatum.instances.length === 0) return;

      const instanceIndex = Math.min(timeIndex, alloyDatum.instances.length - 1);
      const alloyDataInstance = new core.AlloyDataInstance(alloyDatum.instances[instanceIndex]);

      const sgraphEvaluator = new core.SGraphQueryEvaluator();
      sgraphEvaluator.initialize({ sourceData: alloyDataInstance });

      // Use parseCndFile to strip projection/sequence blocks before passing to parseLayoutSpec
      const parsedCnd = parseCndFile(specText || '');
      let layoutSpec = null;
      try {
        layoutSpec = core.parseLayoutSpec(parsedCnd.layoutYaml);
      } catch {
        layoutSpec = core.parseLayoutSpec('');
      }

      const layoutInstance = new core.LayoutInstance(
        layoutSpec,
        sgraphEvaluator,
        instanceIndex,
        true
      );

      // Single-arg generateLayout (projections handled via applyProjectionTransform elsewhere)
      const layoutResult = layoutInstance.generateLayout(alloyDataInstance);

      // If CND spec has projections, use applyProjectionTransform to get choices
      if (parsedCnd.projections.length > 0 && typeof core.applyProjectionTransform === 'function') {
        try {
          // Convert selectedProjections (Record<string, string[]>) to Record<string, string>
          // by taking the first selected atom per type
          const singleSelections: Record<string, string> = {};
          for (const [typeId, atoms] of Object.entries(selectedProjections)) {
            if (Array.isArray(atoms) && atoms.length > 0) {
              singleSelections[typeId] = atoms[0];
            }
          }
          // spytial-core expects { sig, orderBy } — our CndProjection uses { type, orderBy }
          const projectionsForCore = parsedCnd.projections.map(p => ({ sig: p.type, orderBy: p.orderBy }));
          const projResult = core.applyProjectionTransform(
            alloyDataInstance,
            projectionsForCore,
            singleSelections,
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
          if (window.updateProjectionData) {
            const choices = (projResult && Array.isArray(projResult.choices)) ? projResult.choices : [];
            window.updateProjectionData(choices);
          }
        } catch (err) {
          console.error('Failed to get projection choices:', err);
          if (window.updateProjectionData) {
            window.updateProjectionData([]);
          }
        }
      } else {
        if (window.updateProjectionData) {
          const projData = (layoutResult && Array.isArray(layoutResult.projectionData))
            ? layoutResult.projectionData
            : [];
          window.updateProjectionData(projData);
        }
      }
    } catch (err) {
      console.error('Failed to refresh projection data:', err);
    }
  }, [datum, timeIndex, selectedProjections]);

  const resetProjectionPanes = useCallback(() => {
    if (!datum) return;
    if (!window.currentProjections) {
      window.currentProjections = {};
    }
    Object.entries(selectedProjections).forEach(([projectionType]) => {
      dispatch(selectedProjectionsSet({
        datum,
        projectionType,
        selectedAtoms: []
      }));
      if (window.currentProjections?.[projectionType]) {
        delete window.currentProjections[projectionType];
      }
    });
  }, [datum, dispatch, selectedProjections]);

  const applyLayout = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!datum) return;

    // The editor already holds the full `.cnd` (projections/temporal included),
    // so there is nothing to merge back — apply the draft verbatim.
    const spec = draftSpec;
    refreshProjectionData(spec);

    // Collapse to single-graph view before re-applying layout.
    resetProjectionPanes();

    window.clearAllErrors?.();

    dispatch(cndSpecSet({ datum, spec }));
  };

  const suggestLayout = async () => {
    if (!datum?.data) return;
    setSuggestionError(null);
    setIsSuggesting(true);
    try {
      const core = getSpytialCore();
      if (!core?.AlloyInstance?.parseAlloyXML || !core.AlloyDataInstance) {
        throw new Error('The Alloy instance parser is unavailable.');
      }
      const alloyDatum = core.AlloyInstance.parseAlloyXML(datum.data);
      if (!alloyDatum.instances?.length) {
        throw new Error('No Alloy or Forge instance is available to analyze.');
      }

      const instances = alloyDatum.instances.map(
        (instance: any) => new core.AlloyDataInstance(instance)
      );
      const primaryIndex = Math.min(timeIndex, instances.length - 1);
      const primary = instances[primaryIndex];
      const examples = instances.filter((_: any, index: number) => index !== primaryIndex);
      const proposal = suggestAlloyLayout(primary, {
        examples,
        rawAlloyInstance: alloyDatum.instances[primaryIndex],
        core,
      });
      const validationCache = new Map<string, LayoutValidationResult>();
      const draft = await resolveValidatedLayout(proposal, (spec) => {
        const cached = validationCache.get(spec);
        if (cached) return cached;
        const result = validateCndSpecWithSpytial(spec, instances, core);
        validationCache.set(spec, result);
        return result;
      });

      // Commit the strongest generated spec (full `.cnd`). cndSpecSet updates
      // the applied and draft values atomically, and the controlled editor then
      // replaces its document in place — one undo step; Builder/Code tab and
      // scroll are preserved (the whole point of #141 Phase 2).
      refreshProjectionData(draft.spec);
      resetProjectionPanes();
      window.clearAllErrors?.();
      dispatch(cndSpecSet({ datum, spec: draft.spec }));
    } catch (error) {
      setSuggestionError(error instanceof Error ? error.message : 'Could not suggest a layout.');
    } finally {
      setIsSuggesting(false);
    }
  };

  const describeLayout = useDisclosure();

  /**
   * Run the NL engine against the live datum. currentSpec is read HERE
   * (translate time) from the live editor draft, so validation context matches
   * the apply context.
   */
  const runTranslate = useCallback(
    async (
      config: LlmProviderConfig,
      utterance: string,
      priorTranscript: LlmMessage[] | undefined,
      onProgress: (event: NlProgressEvent) => void
    ) => {
      if (!datum?.data) throw new Error('No instance is loaded.');
      const core = getSpytialCore();
      if (!core?.AlloyInstance?.parseAlloyXML || !core.AlloyDataInstance) {
        throw new Error('The Alloy instance parser is unavailable.');
      }
      const alloyDatum = core.AlloyInstance.parseAlloyXML(datum.data);
      if (!alloyDatum.instances?.length) {
        throw new Error('No Alloy or Forge instance is available to analyze.');
      }
      const instances = alloyDatum.instances.map(
        (instance: any) => new core.AlloyDataInstance(instance)
      );
      const primaryIndex = Math.min(timeIndex, instances.length - 1);
      const currentSpec = latestSpecRef.current;
      return translateLayoutIntent(
        {
          utterance,
          currentSpec,
          ...(priorTranscript?.length ? { priorTranscript } : {})
        },
        {
          provider: createFetchProvider(config),
          core,
          instances,
          rawInstance: alloyDatum.instances[primaryIndex],
          onProgress
        }
      );
    },
    [datum, timeIndex]
  );

  /** Merge accepted NL patches into the editor + graph — the suggestLayout tail. */
  const applyNlPatches = useCallback(
    (patches: CndPatch[]) => {
      if (!datum) return;
      let spec = latestSpecRef.current;
      for (const patch of patches) {
        spec = mergeSpecWithPatch(spec, patch);
      }

      refreshProjectionData(spec);
      resetProjectionPanes();
      window.clearAllErrors?.();
      dispatch(cndSpecSet({ datum, spec }));
    },
    [datum, dispatch, refreshProjectionData, resetProjectionPanes]
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!datum) return;

    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        // Show the uploaded spec in the editor (previously a gap — the editor
        // kept the old content) and apply it. The full spec, including any
        // projections/temporal blocks, round-trips through the editor.
        refreshProjectionData(text);
        dispatch(cndSpecSet({ datum, spec: text }));
      };
      reader.readAsText(file);
    }
  };

  if (!datum) {
    return null;
  }

  return (
    <div className="absolute inset-0 flex flex-col overflow-y-auto text-ink" style={{ background: 'var(--ccd-overlay)' }}>
      <div className="flex-1 space-y-3 p-3">
        {/* Actions */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={applyLayout}
            className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-on-accent shadow-sm transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Apply Layout
          </button>

          <button
            type="button"
            onClick={suggestLayout}
            disabled={isSuggesting || !getSpytialCore()?.AlloyInstance?.parseAlloyXML}
            title="Generate and apply an editable CnD layout from the current instance"
            className="flex-1 rounded-lg border border-accent-border bg-accent-bg px-4 py-2.5 text-sm font-medium text-accent transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSuggesting ? 'Analyzing…' : 'Suggest layout'}
          </button>

          <button
            type="button"
            onClick={describeLayout.onOpen}
            disabled={!datum?.data || !getSpytialCore()?.parseLayoutSpec}
            title="Describe a layout in plain language; an LLM drafts it and it is validated against the current instance"
            className="flex-1 rounded-lg border border-accent-border bg-accent-bg px-4 py-2.5 text-sm font-medium text-accent transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Describe layout…
          </button>

          <label className="group relative flex-1 cursor-pointer">
            <div className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-rule-strong bg-surface px-4 py-2.5 text-sm font-medium text-ink-muted transition hover:border-accent-border hover:text-accent">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload .cnd
            </div>
            <input
              type="file"
              accept=".cnd"
              onChange={handleFileUpload}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </label>
        </div>

        {suggestionError && (
          <div className="rounded-lg border border-danger bg-danger-bg p-3 text-sm text-danger">
            {suggestionError}
          </div>
        )}

        {/* Editor — rendered directly as a controlled React component (spytial-core
            >= 4.0.0's `spytial-core/react`). The Redux draft is the single source
            of truth; no window-global mount, no remount on suggestion. */}
        <div className="rounded-lg border border-rule bg-surface shadow-sm p-3">
          <CndLayoutInterface
            value={draftSpec}
            onChange={(next: string) => dispatch(cndDraftSpecSet({ datum, spec: next }))}
            instance={dataInstance}
            theme={colorMode}
            className="min-h-[360px]"
          />
        </div>
      </div>

      <DescribeLayoutModal
        isOpen={describeLayout.isOpen}
        onClose={describeLayout.onClose}
        runTranslate={runTranslate}
        applyPatches={applyNlPatches}
      />
    </div>
  );
};

export default GraphLayoutDrawer;

const GraphLayoutDrawerHeader = () => {
  return (
    <div className='w-full flex items-center px-2 space-x-2'>
      <PaneTitle>Layout</PaneTitle>
    </div>
  );
};

export { GraphLayoutDrawer, GraphLayoutDrawerHeader };
