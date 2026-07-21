/**
 * A single non-fatal diagnostic from spytial-core >= 3.3.0's parseLayoutSpec.
 *
 * `code` is a machine-readable category (`deprecated` / `unknown-key` /
 * `missing-required` / …); `message` is human-readable, with any "did you mean"
 * or replacement hint baked into the text. Warnings never prevent a render —
 * that is what separates them from errors, which throw.
 */
export interface LayoutSpecWarning {
  code: string;
  message: string;
}

/**
 * Return shape of spytial-core >= 3.3.0's parseLayoutSpec. `warnings` is always
 * present (empty array when the spec is clean). Real syntax/validation errors
 * THROW instead of populating this array.
 */
export interface ParsedLayoutSpec {
  constraints?: any;
  directives?: any;
  warnings?: LayoutSpecWarning[];
}

export interface SpytialCoreApi {
  AlloyInstance: {
    parseAlloyXML: (xml: string) => any;
  };
  AlloyDataInstance: new (instance: any) => any;
  SGraphQueryEvaluator: new () => {
    initialize: (context: { sourceData: any }) => void;
    evaluate: (expression: string, config?: any) => any;
  };
  parseLayoutSpec: (spec: string) => ParsedLayoutSpec;
  LayoutInstance: new (
    layoutSpec: any,
    evaluator: any,
    instanceNumber: number,
    enableAlignmentEdges: boolean
  ) => {
    generateLayout: (dataInstance: any) => {
      layout: any;
      projectionData?: any[];
      selectorErrors?: any[];
      error?: {
        type?: string;
        message: string;
        errorMessages?: any;
        overlappingNodes?: any;
      };
    };
  };
  applyProjectionTransform?: (
    instance: any,
    projections: Array<{ sig: string; orderBy?: string }>,
    selections: Record<string, string>,
    options?: {
      evaluateOrderBy?: (selector: string) => string[][];
      onOrderByError?: (selector: string, error: unknown) => void;
    }
  ) => {
    instance: any;
    choices: Array<{
      type: string;
      projectedAtom: string;
      atoms: string[];
    }>;
  };
  getSequencePolicy?: (name: string) => {
    readonly name: string;
    apply: (context: any) => any;
  };
  synthesizeAtomSelector?: (
    examples: { atomIds: string[]; instanceData: any }[],
    maxDepth?: number
  ) => { expression: string; matchesByInstance: any[] } | null;
  synthesizeAtomSelectorWithExplanation?: (
    examples: { atomIds: string[]; instanceData: any }[],
    maxDepth?: number
  ) => {
    expression: string;
    explanation: string;
    matchesByInstance: { instanceIndex: number; matchedAtomIds: string[] }[];
  } | null;
  synthesizeBinarySelector?: (
    examples: { pairs: [string, string][]; instanceData: any }[],
    maxDepth?: number
  ) => {
    expression: string;
    pairMatchesByInstance: { instanceIndex: number; matchedPairs: [string, string][] }[];
  } | null;
  synthesizeBinarySelectorWithExplanation?: (
    examples: { pairs: [string, string][]; instanceData: any }[],
    maxDepth?: number
  ) => {
    expression: string;
    explanation?: string;
    pairMatchesByInstance: { instanceIndex: number; matchedPairs: [string, string][] }[];
  } | null;
  isSynthesisSupported?: (evaluator: any) => boolean;
  mountCndLayoutInterface?: (elementId?: string, options?: any) => void;
}

declare global {
  interface Window {
    spytialcore?: SpytialCoreApi;
    CndCore?: SpytialCoreApi;
    CnDCore?: SpytialCoreApi;
    mountCndLayoutInterface?: (elementId?: string, options?: any) => void;
    mountErrorMessageModal?: (elementId?: string) => void;
    /**
     * Push a data instance into SpyTial's shared instance state so the mounted
     * spec editor (spytial-core >= 2.9.0) becomes domain-aware: type/relation
     * dropdowns and selector autocomplete are derived from this instance.
     */
    updateInstanceFromReact?: (instance: any) => void;
    /**
     * Push a new layout spec into the mounted spec editor (spytial-core >=
     * 3.4.0). The editor replaces its document in place — no remount, view and
     * scroll preserved, one undo step. Absent on older cores; feature-detect
     * and fall back to remounting.
     */
    updateSpecFromReact?: (yaml: string) => void;
    showParseError?: (message: string, context: string) => void;
    showGeneralError?: (message: string) => void;
    showPositionalError?: (errorMessages: any) => void;
    showGroupOverlapError?: (message: string) => void;
    showHiddenNodeConflict?: (errorMessages: any) => void;
    showSelectorErrors?: (errors: any[]) => void;
    clearAllErrors?: () => void;
    updateProjectionData?: (projectionData: any[]) => void;
    currentProjections?: Record<string, string>;
    getCurrentCNDSpecFromReact?: () => string;
  }
}

export function getSpytialCore(): SpytialCoreApi | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const candidates = [window.spytialcore, window.CndCore, window.CnDCore];
  return candidates.find(
    (candidate): candidate is SpytialCoreApi =>
      Boolean(candidate) && typeof candidate.parseLayoutSpec === 'function',
  );
}

export function hasSpytialCore(): boolean {
  return typeof getSpytialCore() !== 'undefined';
}

/**
 * Remove the graph's built-in "Mode" theme dropdown from its toolbar.
 *
 * The webcola-cnd-graph element (spytial-core) ships a `Mode:` <select> in its
 * shadow-DOM toolbar (the `#mode-control` group) that lets the user switch the
 * graph's color theme per-instance. CopeAndDrag owns theming globally — the app
 * color mode drives every graph via setTheme() — so the per-graph control is
 * redundant and can desync the app chrome from the graph. We drop it here.
 *
 * The toolbar is built once, synchronously, in the element's constructor
 * (initializeDOM sets shadowRoot.innerHTML and is never re-run on relayout), so
 * `#mode-control` is present immediately after createElement and is safe to
 * remove at that point. No-op if the element hasn't been upgraded yet.
 */
export function removeGraphThemeControl(graphElement: HTMLElement): void {
  graphElement.shadowRoot?.querySelector('#mode-control')?.remove();
}

/**
 * Ensure the SpyTial Bootstrap stylesheet is present in <head>.
 *
 * SpyTial's mounted React components — the CnD layout editor and the error
 * message modal — are styled with Bootstrap utility classes (`card`,
 * `border-danger`, `var(--bs-danger)`, …) that the component CSS bundle does
 * not ship. The stylesheet is injected lazily and only once, no matter how
 * many components request it.
 */
export function ensureBootstrapLoaded(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById('spytial-bootstrap-stylesheet')) return;

  const link = document.createElement('link');
  link.id = 'spytial-bootstrap-stylesheet';
  link.rel = 'stylesheet';
  link.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css';
  link.integrity = 'sha384-9ndCyUaIbzAi2FUVXJi0CjmCapSmO7SnpJef0486qhLnuZ2cdeRhO02iuK6FUUVM';
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

/**
 * Extract the advisory warnings from a layout-spec YAML.
 *
 * spytial-core >= 3.3.0's parseLayoutSpec returns non-fatal `warnings`
 * ({ code, message }) alongside the parsed spec — deprecated keys, unknown-key
 * typos, etc. Real syntax/validation errors THROW instead (surfaced separately
 * by the SpyTial error modal), so we swallow them here and report no warnings:
 * a spec that fails to parse has an error, not a warning.
 *
 * @param layoutYaml Layout YAML with projection/sequence blocks already stripped
 *   (i.e. `parseCndFile(spec).layoutYaml`). Passing a full CnD spec would make
 *   the parser choke on the projection/temporal blocks it doesn't understand.
 * @returns The warnings array (empty when the spec is clean, core is unavailable,
 *   or the spec errors).
 */
export function getLayoutSpecWarnings(layoutYaml: string): LayoutSpecWarning[] {
  const core = getSpytialCore();
  if (!core) return [];
  try {
    const parsed = core.parseLayoutSpec(layoutYaml);
    return Array.isArray(parsed?.warnings) ? parsed.warnings : [];
  } catch {
    return [];
  }
}
