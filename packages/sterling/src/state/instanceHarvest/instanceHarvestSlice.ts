import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { newInstanceHarvestState } from './instanceHarvest';

/**
 * Instance-harvest slice. The request/receive protocol lives in
 * instanceHarvestMiddleware; this slice only tracks progress and results.
 */
const instanceHarvestSlice = createSlice({
  name: 'instanceHarvest',
  initialState: newInstanceHarvestState(),
  reducers: {
    harvestStarted(
      state,
      action: PayloadAction<{ targetCount: number; generatorName?: string }>
    ) {
      state.status = 'harvesting';
      state.targetCount = action.payload.targetCount;
      state.generatorName = action.payload.generatorName;
      state.instances = [];
      state.error = null;
    },
    harvestInstanceLoaded(state, action: PayloadAction<{ instance: any }>) {
      state.instances.push(action.payload.instance);
      if (state.instances.length >= state.targetCount) {
        state.status = 'done';
      }
    },
    /**
     * The provider exhausted its instance stream before targetCount was
     * reached. Instances collected so far remain available to the caller.
     */
    harvestOutOfInstances(state) {
      state.status = 'outOfInstances';
    },
    harvestFailed(state, action: PayloadAction<{ error: string }>) {
      state.status = 'error';
      state.error = action.payload.error;
    },
    harvestReset(state) {
      Object.assign(state, newInstanceHarvestState());
    }
  }
});

export const {
  harvestStarted,
  harvestInstanceLoaded,
  harvestOutOfInstances,
  harvestFailed,
  harvestReset
} = instanceHarvestSlice.actions;

export default instanceHarvestSlice.reducer;
