import { createSlice } from '@reduxjs/toolkit';
import { graphChanged } from '../graph/graphSlice';
import { createSelectionState, SelectionState } from './selection';
import { extraReducers, reducers } from './selectionReducers';

const initialState: SelectionState = createSelectionState();

const selectionSlice = createSlice({
    name: 'selection',
    initialState,
    reducers,
    extraReducers: builder => {
        builder.addCase(graphChanged, extraReducers.graphChanged)
    }
});

export const {
    dragOffsetChanged,
    selectionChanged
} = selectionSlice.actions;
export default selectionSlice.reducer;