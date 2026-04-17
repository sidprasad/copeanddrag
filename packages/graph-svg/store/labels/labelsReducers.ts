import { PayloadAction } from '@reduxjs/toolkit';
import { Dict, EdgeLabelDef, LabelDef } from '../../components/types';
import { LabelsState } from './labels';

const edgeLabelsChanged = (state: LabelsState, action: PayloadAction<Dict<EdgeLabelDef[]>>) => {
    state.edgeLabels = action.payload;
};

const nodeLabelsChanged = (state: LabelsState, action: PayloadAction<Dict<LabelDef[]>>) => {
    state.nodeLabels = action.payload;
};

const reducers = {
    edgeLabelsChanged,
    nodeLabelsChanged
};

export { reducers };