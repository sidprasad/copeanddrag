import { dataReceived } from '@/sterling-connection';
import { createSlice } from '@reduxjs/toolkit';
import { DataState, newDataState } from './data';
import reducers from './dataReducers';
import extraReducers from './dataExtraReducers';

const initialState: DataState = newDataState();

const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers,
  extraReducers: (builder) =>
    builder.addCase(dataReceived, extraReducers.dataReceived)
});

export const { activeDatumSet, dumpClicked } = dataSlice.actions;
export default dataSlice.reducer;
