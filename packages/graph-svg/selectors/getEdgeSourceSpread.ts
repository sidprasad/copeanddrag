import { PositionedNode } from '@graph-ts/graph-lib';
import { Vector2 } from '@graph-ts/vector2';
import { createCachedSelector } from 're-reselect';
import { applyToPoint, Matrix } from 'transformation-matrix';
import { getEdgeSource, getSpreadMatrix } from '../store/store';
import { keySelectorEdgeID } from './keySelectors';

const combiner = <N extends PositionedNode> (source: N, spread: Matrix): Vector2 =>
    applyToPoint(spread, source);

/**
 * Get an edge's source node location with the spread matrix applied.
 */
export const getEdgeSourceSpread = createCachedSelector(
    getEdgeSource,
    getSpreadMatrix,
    combiner
)(keySelectorEdgeID);