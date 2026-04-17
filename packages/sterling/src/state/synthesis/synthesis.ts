/**
 * State management for selector synthesis mode
 */

export type SelectorType = 'unary' | 'binary';

export interface SynthesisExample {
  /** Instance index (0-based) */
  instanceIndex: number;
  /** Atom IDs selected in this instance (for unary selectors) */
  selectedAtomIds: string[];
  /** Atom pairs selected in this instance (for binary selectors) */
  selectedPairs: [string, string][];
  /** The AlloyDataInstance for this example (needed for synthesis API) */
  dataInstance: any; // AlloyDataInstance
}

export interface SynthesisResult {
  /** The synthesized selector expression */
  expression: string;
  /** Explanation/provenance for the synthesis */
  explanation?: any;
  /** What this selector matches in each instance (for unary) */
  matchesByInstance: {
    instanceIndex: number;
    matchedAtomIds: string[];
  }[];
  /** What this selector matches in each instance (for binary) */
  pairMatchesByInstance: {
    instanceIndex: number;
    matchedPairs: [string, string][];
  }[];
}

export interface SynthesisState {
  /** Whether synthesis mode is active */
  isActive: boolean;
  /** Type of selector being synthesized */
  selectorType: SelectorType;
  /** Number of instances to load for synthesis */
  numInstances: number;
  /** Current step in the workflow (0 = setup, 1-N = collecting examples, N+1 = results) */
  currentStep: number;
  /** Examples collected from user selections */
  examples: SynthesisExample[];
  /** Draft selection for the current instance being edited (not yet committed) */
  draftSelection: {
    atomIds: string[];
    pairs: [string, string][];
  };
  /** Loaded instances for synthesis */
  loadedInstances: any[]; // Array of AlloyDataInstance
  /** Current AlloyDataInstance being viewed (for synthesis) */
  currentDataInstance: any | null;
  /** The synthesized result, if available */
  result: SynthesisResult | null;
  /** Error message, if synthesis failed */
  error: string | null;
  /** Loading state */
  isLoading: boolean;
}

/**
 * Create initial synthesis state
 */
export function newSynthesisState(): SynthesisState {
  return {
    isActive: false,
    selectorType: 'unary',
    numInstances: 3, // Default
    currentStep: 0,
    examples: [],
    draftSelection: {
      atomIds: [],
      pairs: []
    },
    loadedInstances: [],
    currentDataInstance: null,
    result: null,
    error: null,
    isLoading: false
  };
}
