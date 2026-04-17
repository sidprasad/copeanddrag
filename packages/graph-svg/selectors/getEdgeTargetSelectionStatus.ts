import { includes } from 'lodash-es';
import createCachedSelector from 're-reselect';
import { getEdgeTargetID, getSelectedNodeIDs } from '../store/store';
import { keySelectorEdgeID } from './keySelectors';

const combiner = (targetNodeID: string, selectedNodes: string[]) =>
    includes(selectedNodes, targetNodeID);

/**
 * Get the selection status of an edge's target node.
 */
export const getEdgeTargetSelectionStatus = createCachedSelector(
    getEdgeTargetID,
    getSelectedNodeIDs,
    combiner
)(keySelectorEdgeID);