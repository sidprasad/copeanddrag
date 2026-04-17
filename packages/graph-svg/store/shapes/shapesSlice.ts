import { createSlice } from '@reduxjs/toolkit';
import { createShapesState, ShapesState } from './shapes';
import { reducers } from './shapesReducers';

const initialState: ShapesState = createShapesState();

const shapesSlice = createSlice({
    name: 'shapes',
    initialState,
    reducers
});

export const {
    defaultShapeChanged,
    shapesChanged
} = shapesSlice.actions;
export default shapesSlice.reducer;