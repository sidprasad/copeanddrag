import { PayloadAction } from '@reduxjs/toolkit';
import { defaultTo } from 'lodash-es';
import { NODE_SHAPE } from '../../components/defaults';
import { Dict, ShapeDef } from '../../components/types';
import { ShapesState } from './shapes';

/**
 * A reducer that responds to changes in the default shape.
 *
 * When the default shape is changed, this reducer sets the new default shape
 * in the shapes slice.
 */
const defaultShapeChanged = (state: ShapesState, action: PayloadAction<ShapeDef | undefined>) => {
    state.defaultShape = defaultTo(action.payload, NODE_SHAPE);
};

/**
 * A reducer that responds to changes in shape definitions for specific nodes.
 *
 * When the shape definitions for the nodes in the graph change, this reducer
 * sets the dictionary in the shapes state slice that maps node IDs to their
 * shape definitions.
 */
const shapesChanged = (state: ShapesState, action: PayloadAction<Dict<ShapeDef>>) => {
    state.byID = action.payload;
};

const reducers = {
    defaultShapeChanged,
    shapesChanged
};

export { reducers };