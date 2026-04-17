import { createSelector } from '@reduxjs/toolkit';
import { difference } from 'lodash-es';
import { getNodeIDs, getSelectedNodeIDs } from '../store/store';

/**
 * Get two arrays of node IDs: those that are not selected and those that are selected.
 */
export const getPartitionedNodeIDs = createSelector(
    [getNodeIDs, getSelectedNodeIDs],
    (nodeIDs, selectedNodeIDs): [string[], string[]] => {
        return [difference(nodeIDs, selectedNodeIDs), selectedNodeIDs];
    }
);