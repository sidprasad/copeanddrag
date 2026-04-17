import { includes } from 'lodash-es';
import createCachedSelector from 're-reselect';
import { getEdgeSourceID, getSelectedNodeIDs } from '../store/store';
import { keySelectorEdgeID } from './keySelectors';

const combiner = (sourceNodeID: string, selectedNodes: string[]) =>
    includes(selectedNodes, sourceNodeID);

/**
 * Get the selection status of an edge's source node.
 */
export const getEdgeSourceSelectionStatus = createCachedSelector(
    getEdgeSourceID,
    getSelectedNodeIDs,
    combiner
)(keySelectorEdgeID);