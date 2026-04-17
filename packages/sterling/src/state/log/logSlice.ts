import {
  buttonClicked,
  dataReceived,
  dataRequested,
  metaReceived,
  sterlingConnected,
  sterlingConnectionError,
  sterlingDisconnected,
  sterlingError
} from '@/sterling-connection';
import { createSlice } from '@reduxjs/toolkit';
import { activeDatumSet } from '../data/dataSlice';
import { LogState, newLogState } from './log';
import reducers from './logReducers';
import extraReducers from './logExtraReducers';

const initialState: LogState = newLogState();

const logSlice = createSlice({
  name: 'log',
  initialState,
  reducers,
  extraReducers: (builder) =>
    builder
      .addCase(activeDatumSet, extraReducers.activeDatumSet)
      .addCase(buttonClicked, extraReducers.buttonClicked)
      .addCase(dataReceived, extraReducers.dataReceived)
      .addCase(dataRequested, extraReducers.dataRequested)
      .addCase(metaReceived, extraReducers.metaReceived)
      .addCase(sterlingConnected, extraReducers.sterlingConnected)
      .addCase(sterlingConnectionError, extraReducers.sterlingConnectionError)
      .addCase(sterlingDisconnected, extraReducers.sterlingDisconnected)
      .addCase(sterlingError, extraReducers.sterlingError)
});

export const { logCleared, sortOrderChanged, filtersChanged } =
  logSlice.actions;
export default logSlice.reducer;
