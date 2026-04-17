import { DataJoinParsed, isDatumAlloy } from '@/sterling-connection';
import { isOutOfInstances } from '@/alloy-instance';
import { PayloadAction } from '@reduxjs/toolkit';
import { castDraft } from 'immer';
import { WritableDraft } from 'immer/dist/types/types-external';
import { identity } from 'transformation-matrix';
import { selectSelectedGenerator } from '../selectors';
import { GraphsState } from './graphs';
import { DEFAULT_THEME } from './graphsDefaults';
import { validateLayouts } from './graphsReducers';
import { parseCndFile } from '../../utils/cndPreParser';

type DraftState = WritableDraft<GraphsState>;

function dataReceived(
  state: DraftState,
  action: PayloadAction<DataJoinParsed>
) {
  const { enter, exit } = action.payload;

  if (enter) {
    // Extract Alloy data, since that's all we know how to use right now
    const alloyData = enter.filter(isDatumAlloy);

    // For each one, generate matrices, initial layout, and theme
    alloyData.forEach((alloyDatum) => {
      // Skip "no more instances" marker from Forge - don't try to generate layout
      if (isOutOfInstances(alloyDatum.parsed)) {
        console.log('[graphsExtraReducers] Skipping "no more instances" marker');
        return;
      }
      
      const datumId = alloyDatum.id;

      // Generate matrices
      state.matricesByDatumId[alloyDatum.id] = {
        datumId,
        spreadMatrix: identity(),
        zoomMatrix: identity()
      };

      // If there is no theme yet for this generator, populate it with the default. 
      const generator = alloyDatum.generatorName ?? ''
      if(!(generator in state.themeByGeneratorName))
        state.themeByGeneratorName[generator] = castDraft(DEFAULT_THEME);

      // Generate the layout associated with no projection
      state.layoutsByDatumId[datumId] = { datumId, layoutById: {} };
      validateLayouts(state, alloyDatum);

      // Choose the first index as the first instance to display
      state.timeByDatumId[datumId] = 0;

      // If a CnD spec is present in the datum AND we don't already have one for this generator,
      // load it into the state. Otherwise, use the default directive to hide disconnected built-ins.
      // Using generator name allows the layout to persist across instances.
      const DEFAULT_CND_SPEC = 'directives:\n  - flag: hideDisconnectedBuiltIns';
      if (!(generator in state.cndSpecByGeneratorName)) {
        const specToLoad = alloyDatum.parsed.visualizerConfig?.cnd ?? DEFAULT_CND_SPEC;
        state.cndSpecByGeneratorName[generator] = specToLoad;

        // Parse projection config and temporal policy from the initial CND spec
        try {
          const parsed = parseCndFile(specToLoad);
          state.projectionConfigByGeneratorName[generator] = parsed.projections;
          state.sequencePolicyByGeneratorName[generator] = parsed.sequence.policy;
        } catch (err) {
          console.error('[graphsExtraReducers] parseCndFile failed:', err);
          state.projectionConfigByGeneratorName[generator] = [];
          state.sequencePolicyByGeneratorName[generator] = 'ignore_history';
        }
      }

      // TODO: Remove during refactor
      state.hiddenByDatumId[datumId] = {};
    });
  }

  if (exit) {
    exit.forEach((datum) => {
      const datumId = datum.id;
      delete state.layoutsByDatumId[datumId];
      delete state.matricesByDatumId[datumId];
      delete state.timeByDatumId[datumId];
      delete state.hiddenByDatumId[datumId];
    });
  }
}

export default {
  dataReceived
};
