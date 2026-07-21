import { sterlingConnectionMiddleware } from '@/sterling-connection';
import { configureStore } from '@reduxjs/toolkit';
import { sterlingMiddleware } from '../middleware/sterlingMiddleware';
import { instanceHarvestMiddleware } from '../middleware/instanceHarvestMiddleware';
import uiSlice from './ui/uiSlice';
import dataSlice from './data/dataSlice';
import evaluatorSlice from './evaluator/evaluatorSlice';
import graphsSlice from './graphs/graphsSlice';
import logSlice from './log/logSlice';
import providerSlice from './provider/providerSlice';
import scriptSlice from './script/scriptSlice';
import instanceHarvestSlice from './instanceHarvest/instanceHarvestSlice';

const store = configureStore({
  reducer: {
    data: dataSlice,
    evaluator: evaluatorSlice,
    graphs: graphsSlice,
    instanceHarvest: instanceHarvestSlice,
    log: logSlice,
    provider: providerSlice,
    script: scriptSlice,
    ui: uiSlice
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these paths in the state because they contain AlloyDataInstance objects
        ignoredPaths: ['instanceHarvest.instances'],
        // Ignore these action types that may pass instances
        ignoredActionPaths: ['payload.instance', 'payload.instances']
      }
    }).prepend(
      sterlingConnectionMiddleware(),
      sterlingMiddleware(),
      instanceHarvestMiddleware
    )
});

export type SterlingState = ReturnType<typeof store.getState>;
export type SterlingDispatch = typeof store.dispatch;
export default store;
