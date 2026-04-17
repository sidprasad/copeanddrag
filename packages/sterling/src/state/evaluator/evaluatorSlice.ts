import { evalReceived, evalRequested } from '@/sterling-connection';
import { createSlice } from '@reduxjs/toolkit';
import { EvaluatorState, newEvaluatorState } from './evaluator';
import extraReducers from './evaluatorExtraReducers';

const initialState: EvaluatorState = newEvaluatorState();

const evaluatorSlice = createSlice({
  name: 'evaluator',
  initialState,
  reducers: {},
  extraReducers: (builder) =>
    builder
      .addCase(evalReceived, extraReducers.evalReceived)
      .addCase(evalRequested, extraReducers.evalRequested)
});

export const {} = evaluatorSlice.actions;
export default evaluatorSlice.reducer;
