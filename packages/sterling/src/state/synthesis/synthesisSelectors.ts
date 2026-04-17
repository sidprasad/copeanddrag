import { SynthesisState } from './synthesis';

/**
 * Select synthesis mode active state
 */
export function selectIsSynthesisActive(state: SynthesisState): boolean {
  return state.isActive;
}

/**
 * Select current synthesis step
 */
export function selectSynthesisStep(state: SynthesisState): number {
  return state.currentStep;
}

/**
 * Select number of instances
 */
export function selectSynthesisNumInstances(state: SynthesisState): number {
  return state.numInstances;
}

/**
 * Select collected examples
 */
export function selectSynthesisExamples(state: SynthesisState) {
  return state.examples;
}

/**
 * Select loaded instances
 */
export function selectSynthesisInstances(state: SynthesisState) {
  return state.loadedInstances;
}

/**
 * Select synthesis result
 */
export function selectSynthesisResult(state: SynthesisState) {
  return state.result;
}

/**
 * Select synthesis error
 */
export function selectSynthesisError(state: SynthesisState) {
  return state.error;
}

/**
 * Select loading state
 */
export function selectSynthesisLoading(state: SynthesisState): boolean {
  return state.isLoading;
}

/**
 * Check if ready to synthesize (all examples collected)
 */
export function selectCanSynthesize(state: SynthesisState): boolean {
  if (state.isLoading || state.examples.length !== state.numInstances) {
    return false;
  }
  
  if (state.selectorType === 'unary') {
    return state.examples.every((ex) => ex.selectedAtomIds.length > 0);
  } else {
    return state.examples.every((ex) => ex.selectedPairs.length > 0);
  }
}
