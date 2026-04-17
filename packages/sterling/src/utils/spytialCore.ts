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
