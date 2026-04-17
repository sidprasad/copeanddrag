import { defaultTo } from 'lodash-es';
import { Dict, EdgeLabelDef, LabelDef } from '../../components/types';

export interface LabelsState {
    nodeLabels: Dict<LabelDef[]>
    edgeLabels: Dict<EdgeLabelDef[]>
}

export const createLabelsState = (
    nodeLabels?: Dict<LabelDef[]>,
    edgeLabels?: Dict<EdgeLabelDef[]>
): LabelsState => {
    return {
        nodeLabels: defaultTo(nodeLabels, {}),
        edgeLabels: defaultTo(edgeLabels, {})
    };
}