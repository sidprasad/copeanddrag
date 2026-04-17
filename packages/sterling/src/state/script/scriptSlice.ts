import { DataJoinParsed, dataReceived } from '@/sterling-connection';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { eachRight, forEach, last } from 'lodash-es';
import { activeDatumSet } from '../data/dataSlice';
import { newScriptState, ScriptStageType, ScriptState } from './script';

const initialState: ScriptState = newScriptState();

const scriptSlice = createSlice({
  name: 'script',
  initialState,
  reducers: {
    scriptStageDimensionsSet(
      state,
      action: PayloadAction<{ width: number; height: number }>
    ) {
      state.stageDimensions = action.payload;
    },
    scriptStageSet(state, action: PayloadAction<ScriptStageType>) {
      state.stage = action.payload;
    },
    scriptTextSet(state, action: PayloadAction<string>) {
      state.text = action.payload;
    },
    scriptTextByDatumSet(state, action: PayloadAction<{id: string, text: string}>) {
      const {id, text} = action.payload
      state.scriptTextByDatumId[id] = text
    }
  }, 
  extraReducers: 
  (builder) =>
    builder
    .addCase(activeDatumSet, (state, action: PayloadAction<string>) => {
      state.text = state.scriptTextByDatumId[action.payload]
    })
    .addCase(dataReceived, (state, action: PayloadAction<DataJoinParsed>) => {
      const { enter, update, exit } = action.payload;
      if (enter) {
        eachRight(enter, (datum) => {
          if('visualizerConfig' in datum.parsed && 'script' in datum.parsed.visualizerConfig) {
            state.scriptTextByDatumId[datum.id] = datum.parsed.visualizerConfig.script
          }})   
          // ** Auto-load the last datum received **
          // Note well: this logic echoes the event-handler for dataReceive in the data slice. 
          // These two MUST be synched, or the wrong visualizer may load for an instance. 
          const active = last(enter);
          if (active) state.text = state.scriptTextByDatumId[active.id];
      }
      if (exit) {
        forEach(exit, (datumId) => { 
          state.scriptTextByDatumId[datumId] = '' 
        })
      }
    })
});

export const { scriptStageSet, scriptStageDimensionsSet, scriptTextSet, scriptTextByDatumSet } =
  scriptSlice.actions;
export default scriptSlice.reducer;
