import { add, Vector2 } from '@graph-ts/vector2';
import createCachedSelector from 're-reselect';
import { getDragOffset } from '../store/store';
import { getEdgeSourceSelectionStatus } from './getEdgeSourceSelectionStatus';
import { getEdgeSourceSpread } from './getEdgeSourceSpread';
import { keySelectorEdgeID } from './keySelectors';

const combiner = (source: Vector2, isSelected: boolean, dragOffset: Vector2) =>
    isSelected ? add(source, dragOffset) : source;

/**
 * Get an edge's source node location with all transforms applied.
 */
export const getEdgeSourceResolved = createCachedSelector(
    getEdgeSourceSpread,
    getEdgeSourceSelectionStatus,
    getDragOffset,
    combiner
)(keySelectorEdgeID);