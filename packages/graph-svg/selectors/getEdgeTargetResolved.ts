import { add, Vector2 } from '@graph-ts/vector2';
import createCachedSelector from 're-reselect';
import { getDragOffset } from '../store/store';
import { getEdgeTargetSelectionStatus } from './getEdgeTargetSelectionStatus';
import { getEdgeTargetSpread } from './getEdgeTargetSpread';
import { keySelectorEdgeID } from './keySelectors';

const combiner = (target: Vector2, isSelected: boolean, dragOffset: Vector2) =>
    isSelected ? add(target, dragOffset) : target;

/**
 * Get an edge's target node location with all transforms applied.
 */
export const getEdgeTargetResolved = createCachedSelector(
    getEdgeTargetSpread,
    getEdgeTargetSelectionStatus,
    getDragOffset,
    combiner
)(keySelectorEdgeID);