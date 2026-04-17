import { createSlice } from '@reduxjs/toolkit';
import { newSynthesisState } from './synthesis';
import synthesisReducers from './synthesisReducers';

/**
 * Synthesis mode slice
 */
const synthesisSlice = createSlice({
  name: 'synthesis',
  initialState: newSynthesisState(),
  reducers: synthesisReducers
});

export const {
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
} = synthesisSlice.actions;

export default synthesisSlice.reducer;
