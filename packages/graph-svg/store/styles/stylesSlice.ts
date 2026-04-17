import { createSlice } from '@reduxjs/toolkit';
import { graphChanged } from '../graph/graphSlice';
import { selectionChanged } from '../selection/selectionSlice';
import { createStylesState, StylesState } from './styles';
import { extraReducers, reducers } from './stylesReducers';

const initialState: StylesState = createStylesState();

const stylesSlice = createSlice({
    name: 'styles',
    initialState,
    reducers,
    extraReducers: builder => {
        builder.addCase(graphChanged, extraReducers.graphChanged);
        builder.addCase(selectionChanged, extraReducers.selectionChanged);
    }
});

export const {
    edgeStyleDefaultsChanged,
    edgeStyleDefsChanged,
    nodeStyleDefaultsChanged,
    nodeStyleDefsChanged,
    waypointStyleChanged
} = stylesSlice.actions;
export default stylesSlice.reducer;