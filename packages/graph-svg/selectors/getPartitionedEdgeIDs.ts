import { createSelector } from '@reduxjs/toolkit';
import { difference } from 'lodash-es';
import { getEdgeIDs, getSelectedEdgeIDs } from '../store/store';

/**
 * Get two arrays of edge IDs: those that are not selected and those that are selected.
 */
export const getPartitionedEdgeIDs = createSelector(
    [getEdgeIDs, getSelectedEdgeIDs],
    (edgeIDs, selectedEdgeIDs): [string[], string[]] => {
        return [difference(edgeIDs, selectedEdgeIDs), selectedEdgeIDs];
    }
);