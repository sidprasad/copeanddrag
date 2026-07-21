import {
  metaReceived,
  sterlingConnected,
  sterlingDisconnected
} from '@/sterling-connection';
import { createSlice } from '@reduxjs/toolkit';
import { newProviderState, ProviderState } from './provider';
import extraReducers from './providerExtraReducers';

const initialState: ProviderState = newProviderState();

const providerSlice = createSlice({
  name: 'provider',
  initialState,
  reducers: {},
  extraReducers: (builder) =>
    builder
      .addCase(metaReceived, extraReducers.metaReceived)
      .addCase(sterlingConnected, extraReducers.sterlingConnected)
      .addCase(sterlingDisconnected, extraReducers.sterlingDisconected)
});

export default providerSlice.reducer;
