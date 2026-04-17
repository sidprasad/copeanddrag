import { PositionedNode } from '@graph-ts/graph-lib';
import { Vector2 } from '@graph-ts/vector2';
import createCachedSelector from 're-reselect';
import { Matrix, applyToPoint } from 'transformation-matrix';
import { getEdgeTarget, getSpreadMatrix } from '../store/store';
import { keySelectorEdgeID } from './keySelectors';

const combiner = <N extends PositionedNode> (target: N, spread: Matrix): Vector2 =>
    applyToPoint(spread, target);

/**
 * Get an edge's target node location with the spread matrix applied.
 */
export const getEdgeTargetSpread = createCachedSelector(
    getEdgeTarget,
    getSpreadMatrix,
    combiner
)(keySelectorEdgeID);