import { LabelsState } from './labels';

export const getEdgeLabel = (state: LabelsState, id: string) =>
    state.edgeLabels[id];
export const getNodeLabel = (state: LabelsState, id: string) =>
    state.nodeLabels[id];