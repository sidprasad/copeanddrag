import { PaneTitle } from '@/sterling-ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSterlingDispatch, useSterlingSelector } from '../../../../state/hooks';
import { selectActiveDatum, selectCnDSpec, selectSelectedProjections, selectTimeIndex, selectProjectionConfig, selectSequencePolicyName } from '../../../../state/selectors';
import { cndSpecSet, selectedProjectionsSet } from '../../../../state/graphs/graphsSlice';
import { parseCndFile } from '../../../../utils/cndPreParser';
import { ensureBootstrapLoaded, getSpytialCore } from '../../../../utils/spytialCore';
import { resolveValidatedLayout, suggestAlloyLayout, validateCndSpecWithSpytial } from '../../../../utils/layoutSuggestions';
import type { LayoutValidationResult } from '../../../../utils/layoutSuggestions';
import * as yaml from 'js-yaml';

/**
 * Re-combine a layout-only YAML string with previously-extracted
 * projections/sequence blocks into a single CND spec string.
 */
function rebuildFullCndSpec(
  layoutYaml: string,
  extraBlocks: Record<string, unknown>
): string {
  // Parse the layout YAML to merge with extra blocks
  let layoutObj: Record<string, unknown> = {};
  if (layoutYaml && layoutYaml.trim()) {
    try {
      const parsed = yaml.load(layoutYaml);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        layoutObj = parsed as Record<string, unknown>;
      }
    } catch {
      // If layout YAML can't be parsed, just return it as-is
      return layoutYaml;
    }
  }
  const merged = { ...extraBlocks, ...layoutObj };
  if (Object.keys(merged).length === 0) return '';
  return yaml.dump(merged, { lineWidth: -1 });
}

const GraphLayoutDrawer = () => {
  const dispatch = useSterlingDispatch();
  const datum = useSterlingSelector(selectActiveDatum);
  const cndEditorRef = useRef<HTMLDivElement>(null);
  const [isEditorMounted, setIsEditorMounted] = useState(false);
  const [editorRevision, setEditorRevision] = useState(0);
  const editorYamlOverrideRef = useRef<string | null>(null);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);

  // Preserve the projections/sequence blocks that were stripped from the
  // editor so we can merge them back when "Apply Layout" is clicked.
  const extraCndBlocksRef = useRef<Record<string, unknown>>({});

  /** Load from XML (if provided) once. */
  const preloadedSpec = useSterlingSelector((state) => datum ? selectCnDSpec(state, datum) : undefined);
  const selectedProjections = useSterlingSelector((state) =>
    datum ? selectSelectedProjections(state, datum) : {}
  );
  const timeIndex = useSterlingSelector((state) =>
    datum ? selectTimeIndex(state, datum) : 0
  );

  // Overrides are scoped to one datum. If editor remounting is later added to
  // datum switching, a generated spec must not leak into the next graph.
  useEffect(() => {
    editorYamlOverrideRef.current = null;
    extraCndBlocksRef.current = {};
    setSuggestionError(null);
  }, [datum?.id]);

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

  // Load Bootstrap for SpyTial UI (used by the mounted CnD editor below).
  useEffect(() => {
    ensureBootstrapLoaded();
  }, []);

  // Push the active datum's data instance into SpyTial's shared instance state
  // so the mounted spec editor (spytial-core >= 2.9.0's rebuilt structured
  // builder) becomes domain-aware: relation/type dropdowns and selector
  // autocomplete are derived from this instance. Mirrors the alloy-demo's
  // `window.updateInstanceFromReact(alloyDataInstance)` call. Re-runs as the
  // datum or time step changes so the editor's domain tracks what's displayed.
  useEffect(() => {
    const xml = datum?.data;
    if (!xml) return;
    const core = getSpytialCore();
    if (!core?.AlloyInstance?.parseAlloyXML || !core.AlloyDataInstance) return;
    try {
      const alloyDatum = core.AlloyInstance.parseAlloyXML(xml);
      if (!alloyDatum.instances || alloyDatum.instances.length === 0) return;
      const instanceIndex = Math.min(timeIndex, alloyDatum.instances.length - 1);
      const alloyDataInstance = new core.AlloyDataInstance(alloyDatum.instances[instanceIndex]);
      window.updateInstanceFromReact?.(alloyDataInstance);
    } catch (err) {
      console.error('Failed to push data instance to spec editor:', err);
    }
  }, [datum?.data, timeIndex]);

  // Mount the CnD Layout Interface from SpyTial
  useEffect(() => {
    if (cndEditorRef.current && !isEditorMounted && datum) {
      const defaultSpec = 'directives:\n  - flag: hideDisconnectedBuiltIns';

      // Strip projections/sequence blocks before passing to SpyTial's editor,
      // which only understands constraints/directives.
      let editorInitialSpec = editorYamlOverrideRef.current ?? defaultSpec;
      if (editorYamlOverrideRef.current === null && preloadedSpec && preloadedSpec !== '') {
        const parsed = parseCndFile(preloadedSpec);
        editorInitialSpec = parsed.layoutYaml || defaultSpec;

        // Stash the extra blocks so we can merge them back on apply
        const extraBlocks: Record<string, unknown> = {};
        if (parsed.projections.length > 0) {
          extraBlocks.projections = parsed.projections;
        }
        if (parsed.sequence.policy !== 'ignore_history') {
          extraBlocks.temporal = { policy: parsed.sequence.policy };
        }
        extraCndBlocksRef.current = extraBlocks;
      }
      
      const options: CndLayoutInterfaceOptions = {
        initialYamlValue: editorInitialSpec,
        initialDirectives: (preloadedSpec && preloadedSpec !== '') ? undefined : [{ flag: 'hideDisconnectedBuiltIns' }]
      };

      try {
        const core = getSpytialCore();
        if (core?.mountCndLayoutInterface) {
          core.mountCndLayoutInterface(`cnd-editor-mount-${editorRevision}`, options);
          setIsEditorMounted(true);
        } else if (window.mountCndLayoutInterface) {
          window.mountCndLayoutInterface(`cnd-editor-mount-${editorRevision}`, options);
          setIsEditorMounted(true);
        }
      } catch (err) {
        console.error('Failed to mount CnD Layout Interface:', err);
      }
    }
  }, [editorRevision, isEditorMounted, datum, preloadedSpec]);

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

    // The editor only contains layout YAML (constraints/directives).
    // Merge back any projections/sequence blocks that were stripped.
    const editorText = window.getCurrentCNDSpecFromReact?.() || '';
    const fullCndSpec = rebuildFullCndSpec(editorText, extraCndBlocksRef.current);
    refreshProjectionData(fullCndSpec);

    // Collapse to single-graph view before re-applying layout.
    resetProjectionPanes();

    if (window.clearAllErrors) {
      window.clearAllErrors();
    }
    
    dispatch(cndSpecSet({ datum, spec: fullCndSpec }));
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
        includePresentation: true,
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

      const parsed = parseCndFile(draft.spec);
      const extraBlocks: Record<string, unknown> = {};
      if (parsed.projections.length > 0) {
        extraBlocks.projections = parsed.projections;
      }
      if (parsed.sequence.policy !== 'ignore_history') {
        extraBlocks.temporal = { policy: parsed.sequence.policy };
      }
      extraCndBlocksRef.current = extraBlocks;

      // Apply the strongest generated spec that passed the real layout pipeline
      // for every state, then reopen it for ordinary hand editing.
      refreshProjectionData(draft.spec);
      resetProjectionPanes();
      window.clearAllErrors?.();
      dispatch(cndSpecSet({ datum, spec: draft.spec }));

      if (typeof window.updateSpecFromReact === 'function') {
        // spytial-core >= 3.4.0: push the generated YAML into the live editor.
        // The document is replaced in place (one undo step); the Builder/Code
        // tab, scroll, and the editor's React root all survive.
        window.updateSpecFromReact(parsed.layoutYaml);
      } else {
        // Older cores have no inbound spec path: reload via a full remount.
        // Re-keying loads the generated YAML but retains the abandoned
        // core-owned root/listener until the core in use ships the push API.
        editorYamlOverrideRef.current = parsed.layoutYaml;
        setIsEditorMounted(false);
        setEditorRevision((revision) => revision + 1);
      }
    } catch (error) {
      setSuggestionError(error instanceof Error ? error.message : 'Could not suggest a layout.');
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!datum) return;
    
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        // The full file may contain projections/sequence blocks.
        // Store the full spec in Redux (cndSpecSet will parse it),
        // and update the extra-blocks ref so future Apply Layout
        // calls preserve them.
        const parsed = parseCndFile(text);
        const extraBlocks: Record<string, unknown> = {};
        if (parsed.projections.length > 0) {
          extraBlocks.projections = parsed.projections;
        }
        if (parsed.sequence.policy !== 'ignore_history') {
          extraBlocks.temporal = { policy: parsed.sequence.policy };
        }
        extraCndBlocksRef.current = extraBlocks;

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

        {/* Editor */}
        <div className="rounded-lg border border-rule bg-surface shadow-sm p-3">
          <div
            key={editorRevision}
            id={`cnd-editor-mount-${editorRevision}`}
            ref={cndEditorRef}
            className="min-h-[360px] overflow-hidden rounded-lg border border-rule bg-surface-muted"
          />
        </div>
      </div>
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
