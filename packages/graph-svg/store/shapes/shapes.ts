import { defaultTo } from 'lodash-es';
import { NODE_SHAPE } from '../../components/defaults';
import { Dict, ShapeDef } from '../../components/types';

export type ShapesState = {
    byID: Dict<ShapeDef>
    defaultShape: ShapeDef
};

export const createShapesState = (
    nodeShapes?: Dict<ShapeDef>,
    defaultShape?: ShapeDef
): ShapesState => {

    return {
        byID: defaultTo(nodeShapes, {}),
        defaultShape: defaultTo(defaultShape, NODE_SHAPE)
    };

}