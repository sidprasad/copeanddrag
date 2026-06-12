export interface SpytialCoreApi {
  AlloyInstance: {
    parseAlloyXML: (xml: string) => any;
  };
  AlloyDataInstance: new (instance: any) => any;
  SGraphQueryEvaluator: new () => {
    initialize: (context: { sourceData: any }) => void;
    evaluate: (expression: string, config?: any) => any;
  };
  parseLayoutSpec: (spec: string) => any;
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
