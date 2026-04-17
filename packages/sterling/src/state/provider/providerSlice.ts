import {
  metaReceived,
  sterlingConnected,
  sterlingDisconnected
} from '@/sterling-connection';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { newProviderState, ProviderState } from './provider';
import extraReducers from './providerExtraReducers';

const initialState: ProviderState = newProviderState();

const providerSlice = createSlice({
  name: 'provider',
  initialState,
  reducers: {
    synthesisFeatureEnabled(state, action: PayloadAction<boolean>) {
      state.synthesisEnabled = action.payload;
    }
  },
  extraReducers: (builder) =>
    builder
      .addCase(metaReceived, extraReducers.metaReceived)
      .addCase(sterlingConnected, extraReducers.sterlingConnected)
      .addCase(sterlingDisconnected, extraReducers.sterlingDisconected)
});

export const { synthesisFeatureEnabled } = providerSlice.actions;
export default providerSlice.reducer;
