import { defaultTo } from 'lodash-es';
import { EDGE_PATH } from '../../components/defaults';
import { Dict, PathDef } from '../../components/types';

export type PathsState = {
    byID: Dict<PathDef>
    defaultPath: PathDef
}

export const createPathsState = (
    edgePaths?: Dict<PathDef>,
    defaultPath?: PathDef
): PathsState => {

    return {
        byID: defaultTo(edgePaths, {}),
        defaultPath: defaultTo(defaultPath, EDGE_PATH)
    }

}