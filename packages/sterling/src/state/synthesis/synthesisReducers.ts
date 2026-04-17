import { WritableDraft } from 'immer/dist/types/types-external';
import { SynthesisExample, SynthesisResult, SynthesisState } from './synthesis';

type DraftState = WritableDraft<SynthesisState>;

/**
 * Enter synthesis mode
 */
function enterSynthesisMode(
  state: DraftState,
  action: { payload: { numInstances: number; selectorType: 'unary' | 'binary' } }
) {
  state.isActive = true;
  state.selectorType = action.payload.selectorType;
  state.numInstances = action.payload.numInstances;
  state.currentStep = 0;
  state.examples = [];
  state.loadedInstances = [];
  state.result = null;
  state.error = null;
  state.isLoading = true; // Will load instances
}

/**
 * Exit synthesis mode
 */
function exitSynthesisMode(state: DraftState) {
  state.isActive = false;
  state.currentStep = 0;
  state.examples = [];
  state.loadedInstances = [];
  state.result = null;
  state.error = null;
  state.isLoading = false;
}

/**
 * Set loaded instances
 */
function synthesisInstancesLoaded(
  state: DraftState,
  action: { payload: { instances: any[] } }
) {
  state.loadedInstances = action.payload.instances;
  state.isLoading = false;
  // Only move to step 1 if we're on step 0 (initial load)
  if (state.currentStep === 0) {
    state.currentStep = 1;
  }
}

/**
 * Set loading error
 */
function synthesisLoadError(
  state: DraftState,
  action: { payload: { error: string } }
) {
  state.error = action.payload.error;
  state.isLoading = false;
}

/**
 * Add an example from user selection
 */
function addSynthesisExample(
  state: DraftState,
  action: { payload: SynthesisExample }
) {
  state.examples.push(action.payload);
  
  // Move to next step if we haven't collected all examples yet
  if (state.currentStep <= state.numInstances) {
    state.currentStep++;
  }
}

/**
 * Update the current example (user changed selection)
 */
function updateSynthesisExample(
  state: DraftState,
  action: { 
    payload: { 
      instanceIndex: number; 
      selectedAtomIds?: string[];
      selectedPairs?: [string, string][];
    } 
  }
) {
  const { instanceIndex, selectedAtomIds, selectedPairs } = action.payload;
  const exampleIndex = state.examples.findIndex(
    (ex) => ex.instanceIndex === instanceIndex
  );
  
  if (exampleIndex >= 0) {
    if (selectedAtomIds !== undefined) {
      state.examples[exampleIndex].selectedAtomIds = selectedAtomIds;
    }
    if (selectedPairs !== undefined) {
      state.examples[exampleIndex].selectedPairs = selectedPairs;
    }
  }
}

/**
 * Go to previous step
 */
function synthesisStepBack(state: DraftState) {
  if (state.currentStep > 1) {
    state.currentStep--;
    // Remove last example if going back
    if (state.examples.length >= state.currentStep) {
      state.examples.pop();
    }
  }
}

/**
 * Set synthesis result
 */
function setSynthesisResult(
  state: DraftState,
  action: { payload: SynthesisResult }
) {
  state.result = action.payload;
  state.error = null;
  state.isLoading = false;
}

/**
 * Set synthesis error
 */
function setSynthesisError(
  state: DraftState,
  action: { payload: { error: string } }
) {
  state.error = action.payload.error;
  state.result = null;
  state.isLoading = false;
}

/**
 * Start synthesis computation
 */
function startSynthesis(state: DraftState) {
  state.isLoading = true;
  state.error = null;
}

/**
 * Handle "no more instances" from Forge during synthesis.
 * This occurs when Forge has exhausted all satisfying instances.
 */
function synthesisOutOfInstances(state: DraftState) {
  state.isLoading = false;
  state.error = 'No more instances available. Forge has exhausted all satisfying instances. Consider using fewer examples for synthesis.';
}

/**
 * Update draft selection (live editing, not committed)
 */
function updateDraftSelection(
  state: DraftState,
  action: { 
    payload: { 
      atomIds?: string[];
      pairs?: [string, string][];
    } 
  }
) {
  if (action.payload.atomIds !== undefined) {
    state.draftSelection.atomIds = action.payload.atomIds;
  }
  if (action.payload.pairs !== undefined) {
    state.draftSelection.pairs = action.payload.pairs;
  }
}

/**
 * Commit draft selection to examples (when clicking Next)
 * Now accepts atomIds and pairs directly in payload (instead of reading from draftSelection)
 */
function commitDraftSelection(
  state: DraftState,
  action: { payload: { instanceIndex: number; dataInstance: any; atomIds?: string[]; pairs?: [string, string][] } }
) {
  const { instanceIndex, dataInstance, atomIds = [], pairs = [] } = action.payload;
  const existingIndex = state.examples.findIndex(ex => ex.instanceIndex === instanceIndex);
  
  if (existingIndex >= 0) {
    // Update existing example
    state.examples[existingIndex].selectedAtomIds = atomIds;
    state.examples[existingIndex].selectedPairs = pairs;
    state.examples[existingIndex].dataInstance = dataInstance;
  } else {
    // Add new example
    state.examples.push({
      instanceIndex,
      selectedAtomIds: [...atomIds],
      selectedPairs: [...pairs],
      dataInstance
    });
  }
  
  // Clear draft and move to next step
  state.draftSelection = { atomIds: [], pairs: [] };
  if (state.currentStep <= state.numInstances) {
    state.currentStep++;
  }
}

/**
 * Set the current AlloyDataInstance (called when graph renders)
 */
function setCurrentDataInstance(
  state: DraftState,
  action: { payload: { dataInstance: any } }
) {
  state.currentDataInstance = action.payload.dataInstance;
}

export default {
  enterSynthesisMode,
  exitSynthesisMode,
  synthesisInstancesLoaded,
  synthesisLoadError,
  synthesisOutOfInstances,
  addSynthesisExample,
  updateSynthesisExample,
  synthesisStepBack,
  setSynthesisResult,
  setSynthesisError,
  startSynthesis,
  updateDraftSelection,
  commitDraftSelection,
  setCurrentDataInstance
};
