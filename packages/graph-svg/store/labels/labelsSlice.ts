import { createSlice } from '@reduxjs/toolkit';
import { createLabelsState, LabelsState } from './labels';
import { reducers } from './labelsReducers';

const initialState: LabelsState = createLabelsState();

const labelsSlice = createSlice({
    name: 'labels',
    initialState,

    // TODO: Figure out why TS doesn't like this.
    // @ts-ignore
    reducers
});

export const {
    edgeLabelsChanged,
    nodeLabelsChanged
} = labelsSlice.actions;
export default labelsSlice.reducer;