import { metaReceived } from '@/sterling-connection';
import { createSlice } from '@reduxjs/toolkit';
import { newUiState, UiState } from './ui';
import uiReducers from './uiReducers';
import extraReducers from './uiExtraReducers';

const initialState: UiState = newUiState();

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: uiReducers,
  extraReducers: (builder) => {
    builder.addCase(metaReceived, extraReducers.metaReceived);
  }
});

export const {
  mainViewChanged,
  commonDrawerViewChanged,
  graphDrawerViewChanged,
  tableDrawerViewChanged,
  scriptDrawerViewChanged,
  editDrawerViewChanged,
  selectedGeneratorChanged
} = uiSlice.actions;
export default uiSlice.reducer;
