import { PaneTitle } from '@/sterling-ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSterlingDispatch, useSterlingSelector } from '../../../../state/hooks';
import { selectActiveDatum, selectCnDSpec, selectSelectedProjections, selectTimeIndex, selectProjectionConfig, selectSequencePolicyName } from '../../../../state/selectors';
import { cndSpecSet, selectedProjectionsSet } from '../../../../state/graphs/graphsSlice';
import { parseCndFile } from '../../../../utils/cndPreParser';
import { getSpytialCore } from '../../../../utils/spytialCore';
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
  const errorMountRef = useRef<HTMLDivElement>(null);
  const [isEditorMounted, setIsEditorMounted] = useState(false);
  const [isErrorMounted, setIsErrorMounted] = useState(false);

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

  // Load Bootstrap for SpyTial UI
  useEffect(() => {
    const existingBootstrap = document.getElementById('spytial-bootstrap-stylesheet');
    if (!existingBootstrap) {
      const link = document.createElement('link');
      link.id = 'spytial-bootstrap-stylesheet';
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css';
      link.integrity = 'sha384-9ndCyUaIbzAi2FUVXJi0CjmCapSmO7SnpJef0486qhLnuZ2cdeRhO02iuK6FUUVM';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }
  }, []);

  // Mount SpyTial error modal
  useEffect(() => {
    if (errorMountRef.current && window.mountErrorMessageModal && !isErrorMounted) {
      try {
        window.mountErrorMessageModal('layout-error-mount');
        setIsErrorMounted(true);
      } catch (err) {
        console.error('Failed to mount SpyTial Error Modal:', err);
      }
    }
  }, [isErrorMounted]);

  // Mount the CnD Layout Interface from SpyTial
  useEffect(() => {
    if (cndEditorRef.current && !isEditorMounted && datum) {
      const defaultSpec = 'directives:\n  - flag: hideDisconnectedBuiltIns';

      // Strip projections/sequence blocks before passing to SpyTial's editor,
      // which only understands constraints/directives.
      let editorInitialSpec = defaultSpec;
      if (preloadedSpec && preloadedSpec !== '') {
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
          core.mountCndLayoutInterface('cnd-editor-mount', options);
          setIsEditorMounted(true);
        } else if (window.mountCndLayoutInterface) {
          window.mountCndLayoutInterface('cnd-editor-mount', options);
          setIsEditorMounted(true);
        }
      } catch (err) {
        console.error('Failed to mount CnD Layout Interface:', err);
      }
    }
  }, [isEditorMounted, datum, preloadedSpec]);

  const applyLayout = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!datum) return;

    // The editor only contains layout YAML (constraints/directives).
    // Merge back any projections/sequence blocks that were stripped.
    const editorText = window.getCurrentCNDSpecFromReact?.() || '';
    const fullCndSpec = rebuildFullCndSpec(editorText, extraCndBlocksRef.current);
    refreshProjectionData(fullCndSpec);

    // Collapse to single-graph view before re-applying layout.
    if (!window.currentProjections) {
      window.currentProjections = {};
    }
    Object.entries(selectedProjections).forEach(([projectionType, atoms]) => {
      dispatch(selectedProjectionsSet({
        datum,
        projectionType,
        selectedAtoms: []
      }));
      if (window.currentProjections && window.currentProjections[projectionType]) {
        delete window.currentProjections[projectionType];
      }
    });

    if (window.clearAllErrors) {
      window.clearAllErrors();
    }
    
    dispatch(cndSpecSet({ datum, spec: fullCndSpec }));
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
    <div className="absolute inset-0 flex flex-col overflow-y-auto bg-slate-50/90 text-slate-900">
      {/* Error display area */}
      <div
        id="layout-error-mount"
        ref={errorMountRef}
        className="flex-shrink-0"
        aria-live="polite"
      />

      <div className="flex-1 space-y-3 p-3">
        {/* Actions */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={applyLayout}
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            Apply Layout
          </button>
          
          <label className="group relative flex-1 cursor-pointer">
            <div className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-indigo-400 hover:text-indigo-600">
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

        {/* Editor */}
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm p-3">
          <div
            id="cnd-editor-mount"
            ref={cndEditorRef}
            className="min-h-[360px] overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
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
