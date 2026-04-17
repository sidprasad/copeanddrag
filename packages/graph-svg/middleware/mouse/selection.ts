import { compact, defaultTo, difference, every, includes, partition, zip } from 'lodash-es';
import { SelectableUpdate, SelectionUpdate } from '../../store/selection/selection';
import {
    getHoveredEdgeID,
    getHoveredNodeID,
    getHoveredWaypointID,
    getSelectedEdgeIDs,
    getSelectedNodeIDs,
    getSelectedWaypointIDs,
    RootState
} from '../../store/store';
import { getEdgeSelectionStatus, getNodeSelectionStatus, getWaypointSelectionStatus } from './utilities';

type IDSelector = (state: RootState) => string | null;
type IDsSelector = (state: RootState) => string[];

/**
 * Build a selectable update to deselect all of a generic type of selectable.
 * @param state The store state
 * @param selectedSelector A function that retrieves an array of selected IDs from the store state
 * @param hoveredSelector A function that retrieves the hovered ID from the store state
 */
function deselectAllSelectables (state: RootState, selectedSelector: IDsSelector, hoveredSelector: IDSelector): SelectableUpdate | undefined {

    const selected = selectedSelector(state);
    const hovered = hoveredSelector(state);

    return selected.length
        ? {
            selection: [],
            hover: hovered,
            updatedIDs: selected,
            updatedSelectionStates: selected.map(_ => false),
            updatedHoverStates: selected.map(id => id === hovered)
        }
        : undefined;

}

/**
 * Build a selectable update to deselect all edges.
 * @param state The store state
 */
function deselectAllEdges (state: RootState): SelectableUpdate | undefined {
    return deselectAllSelectables(state, getSelectedEdgeIDs, getHoveredEdgeID);
}

/**
 * Build a selectable update to deselect all nodes.
 * @param state The store state
 */
function deselectAllNodes (state: RootState): SelectableUpdate | undefined {
    return deselectAllSelectables(state, getSelectedNodeIDs, getHoveredNodeID);
}

/**
 * Build a selectable update to deselect all waypoints.
 * @param state The store state
 */
function deselectAllWaypoints (state: RootState): SelectableUpdate | undefined {
    return deselectAllSelectables(state, getSelectedWaypointIDs, getHoveredWaypointID);
}

/**
 * Build a selection update to clear the current selection (nodes, edges, waypoints).
 * @param state The store state
 */
export function deselectAll (state: RootState): SelectionUpdate {
    return {
        nodes: deselectAllNodes(state),
        edges: deselectAllEdges(state),
        waypoints: deselectAllWaypoints(state)
    }
}

/**
 * Build a selection update to hover an edge.
 * @param state The store state
 * @param edgeID An edge ID
 */
export function hoverEdge (state: RootState, edgeID: string): SelectionUpdate {
    return {
        nodes: setHoveredNode(state, null),
        edges: setHoveredEdge(state, edgeID),
        waypoints: setHoveredWaypoint(state, null)
    }
}

/**
 * Build a selection update to hover a node
 * @param state The store state
 * @param nodeID A node ID
 */
export function hoverNode (state: RootState, nodeID: string): SelectionUpdate {
    return {
        nodes: setHoveredNode(state, nodeID),
        edges: setHoveredEdge(state, null),
        waypoints: setHoveredWaypoint(state, null)
    }
}

/**
 * Build a selection update to hover a waypoint
 * @param state The store state
 * @param waypointID A waypoint ID
 */
export function hoverWaypoint (state: RootState, waypointID: string): SelectionUpdate {
    return {
        nodes: setHoveredNode(state, null),
        edges: setHoveredEdge(state, null),
        waypoints: setHoveredWaypoint(state, waypointID)
    }
}

/**
 * Build a selection update to hover nothing.
 * @param state The store state
 */
export function hoverNothing (state: RootState): SelectionUpdate {
    return {
        nodes: setHoveredNode(state, null),
        edges: setHoveredEdge(state, null),
        waypoints: setHoveredWaypoint(state, null)
    }
}

/**
 * Build a selection update to select a set of edges, clearing all other selection types.
 * @param state The store state
 * @param edgeIDs An array of edge IDs
 */
export function selectEdges (state: RootState, edgeIDs: string[]): SelectionUpdate {

    const selectedEdgeIDs = getSelectedEdgeIDs(state);
    const hoveredEdgeID = getHoveredEdgeID(state);

    // Of those to be selected, determine which are already selected and which must become selected
    const [toStaySelected, toSelect] = partition(edgeIDs, edgeID => includes(selectedEdgeIDs, edgeID));

    // Create array of edgeIDs to be deselected
    const toDeselect = difference(selectedEdgeIDs, toStaySelected);

    return {
        nodes: deselectAllNodes(state),
        edges: {
            selection: edgeIDs,
            hover: hoveredEdgeID,
            updatedIDs: [...toSelect, ...toDeselect],
            updatedSelectionStates: [...toSelect.map(_ => true), ...toDeselect.map(_ => false)],
            updatedHoverStates: [...toSelect.map(id => id === hoveredEdgeID), ...toDeselect.map(id => id === hoveredEdgeID)]
        },
        waypoints: deselectAllWaypoints(state)
    }

}

/**
 * Build a selection update to select a set of nodes, clearing all other selection types.
 * @param state The store state
 * @param nodeIDs An array of node IDs
 */
export function selectNodes (state: RootState, nodeIDs: string[]): SelectionUpdate {

    // Get the current selections
    const selectedNodeIDs = getSelectedNodeIDs(state);
    const hoveredNodeID = getHoveredNodeID(state);

    // Of those to be selected, determine which are already selected and which must become selected
    const [toStaySelected, toSelect] = partition(nodeIDs, nodeID => includes(selectedNodeIDs, nodeID));

    // Create array of nodeIDs to be deselected
    const toDeselect = difference(selectedNodeIDs, toStaySelected);

    return {
        nodes: {
            selection: nodeIDs,
            hover: hoveredNodeID,
            updatedIDs: [...toSelect, ...toDeselect],
            updatedSelectionStates: [...toSelect.map(_ => true), ...toDeselect.map(_ => false)],
            updatedHoverStates: [...toSelect.map(id => id === hoveredNodeID), ...toDeselect.map(id => id === hoveredNodeID)]
        },
        edges: deselectAllEdges(state),
        waypoints: deselectAllWaypoints(state)
    }

}

/**
 * Build a selection update to select a set of waypoints, clearing node selection.
 * @param state The store state
 * @param waypointIDs An array of waypoint IDs
 */
export function selectWaypoints (state: RootState, waypointIDs: string[]): SelectionUpdate {

    // Get the current selections
    const selectedWaypointIDs = getSelectedWaypointIDs(state);
    const hoveredWaypointID = getHoveredWaypointID(state);

    // Of those to be selected, determine which are already selected and which must become selected
    const [toStaySelected, toSelect] = partition(waypointIDs, waypointID => includes(selectedWaypointIDs, waypointID));

    // Create array of waypoint IDs to be deselected
    const toDeselect = difference(selectedWaypointIDs, toStaySelected);

    return {
        nodes: deselectAllNodes(state),
        waypoints: {
            selection: waypointIDs,
            hover: hoveredWaypointID,
            updatedIDs: [...toSelect, ...toDeselect],
            updatedSelectionStates: [...toSelect.map(_ => true), ...toDeselect.map(_ => false)],
            updatedHoverStates: [...toSelect.map(id => id === hoveredWaypointID), ...toDeselect.map(id => id === hoveredWaypointID)]
        }
    }

}

/**
 * Build a selectable update to hover an edge or clear the currently hovering edge.
 * Returns undefined if the requested edge ID is the same as the currently hovered edge ID.
 * @param state The store state
 * @param edgeID An edge ID or null to clear the hovered edge
 */
function setHoveredEdge (state: RootState, edgeID: string | null): SelectableUpdate | undefined {

    // Get the current hovered edge ID and return undefined if it's the same as the new one
    const hoveredEdgeID = getHoveredEdgeID(state);
    if (hoveredEdgeID === edgeID) return undefined;

    // Not the same, so set the new hovered edge ID
    const id = defaultTo(edgeID, hoveredEdgeID) as string;
    const selectedEdgeIDs = getSelectedEdgeIDs(state);
    return {
        selection: selectedEdgeIDs,
        hover: edgeID,
        updatedIDs: [id],
        updatedSelectionStates: [includes(selectedEdgeIDs, id)],
        updatedHoverStates: [edgeID !== null]
    }

}

/**
 * Build a selectable update to hover a node or clear the currently hovering node.
 * Returns undefined if the requested node ID is the same as the currently hovered node ID.
 * @param state The store state
 * @param nodeID A node ID or null to clear the hovered node
 */
function setHoveredNode (state: RootState, nodeID: string | null): SelectableUpdate | undefined {

    // Get the current hovered node ID and return undefined if it's the same as the new one
    const hoveredNodeID = getHoveredNodeID(state);
    if (hoveredNodeID === nodeID) return undefined;

    // Not the same, so set the new hovered node ID
    const id = defaultTo(nodeID, hoveredNodeID) as string;
    const selectedNodeIDs = getSelectedNodeIDs(state);
    return {
        selection: selectedNodeIDs,
        hover: nodeID,
        updatedIDs: [id],
        updatedSelectionStates: [includes(selectedNodeIDs, id)],
        updatedHoverStates: [nodeID !== null]
    };
}

/**
 * Build a selectable update to hover a waypoint or clear the currently hovering waypoint.
 * Returns undefined if the requested waypoint ID is the same as the currently hovered waypoint ID.
 * @param state The store state
 * @param waypointID A waypoint ID or null to clear the hovered waypoint
 */
function setHoveredWaypoint (state: RootState, waypointID: string | null): SelectableUpdate | undefined {

    // Get the current hovered waypoint ID and return undefined if it's the same as the new one
    const hoveredWaypointID = getHoveredWaypointID(state);
    if (hoveredWaypointID === waypointID) return undefined;

    // No the same, so set the new hovered waypointID
    const id = defaultTo(waypointID, hoveredWaypointID) as string;
    const selectedWaypointIDs = getSelectedWaypointIDs(state);
    return {
        selection: selectedWaypointIDs,
        hover: waypointID,
        updatedIDs: [id],
        updatedSelectionStates: [includes(selectedWaypointIDs, id)],
        updatedHoverStates: [waypointID !== null]
    }

}

/**
 * Build a selection update to toggle edges in the current selection. If any of the
 * provided edge IDs are not in the current selection, they will be added. If all of
 * the provided edge IDs are in the current selection, they will be removed. Other
 * selection types are unchanged.
 * @param state The store state
 * @param edgeIDs An array of edge IDs
 */
export function toggleEdges (state: RootState, edgeIDs: string[]): SelectionUpdate {

    // Get the current edge selection
    const selectedEdgeIDs = getSelectedEdgeIDs(state);

    // Get current selection state for edges that are toggling
    const edgeStates = getEdgeSelectionStatus(state, edgeIDs);

    // If every toggling edge is already selected, remove them all from the selection
    if (every(edgeStates)) {
        return {
            edges: deselectAllEdges(state)
        }
    }

    // Otherwise add the edges that aren't yet in the selection
    else {
        const addedEdges = compact(zip(edgeIDs, edgeStates).map(([edgeID, inSelection]) => inSelection ? undefined : edgeID));
        const hoveredEdgeID = getHoveredEdgeID(state);
        return {
            edges: {
                selection: [...selectedEdgeIDs, ...addedEdges],
                hover: hoveredEdgeID,
                updatedIDs: addedEdges,
                updatedSelectionStates: addedEdges.map(_ => true),
                updatedHoverStates: addedEdges.map(id => id === hoveredEdgeID)
            }
        }
    }
}

/**
 * Build a selection update to toggle nodes in the current selection. If any of the
 * provided node IDs are not in the current selection, they will be added. If all of
 * the provided node IDs are in the current selection, they will be removed. Other
 * selection types are unchanged.
 * @param state The store state
 * @param nodeIDs An array of node IDs
 */
export function toggleNodes (state: RootState, nodeIDs: string[]): SelectionUpdate {

    // Get the current node selection
    const selectedNodeIDs = getSelectedNodeIDs(state);

    // Get current selection state for nodes that are toggling
    const nodeStates = getNodeSelectionStatus(state, nodeIDs);

    // If every toggling node is already selected, remove them all from the selection
    if (every(nodeStates)) {
        return {
            nodes: deselectAllNodes(state)
        }
    }

    // Otherwise add the nodes that aren't yet in the selection
    else {
        const addedNodes = compact(zip(nodeIDs, nodeStates).map(([nodeID, inSelection]) => inSelection ? undefined : nodeID));
        const hoveredNodeID = getHoveredNodeID(state);
        return {
            nodes: {
                selection: [...selectedNodeIDs, ...addedNodes],
                hover: hoveredNodeID,
                updatedIDs: addedNodes,
                updatedSelectionStates: addedNodes.map(_ => true),
                updatedHoverStates: addedNodes.map(id => id === hoveredNodeID)
            }
        }
    }

}

/**
 * Build a selection update to toggle waypoints in the current selection. If any of the
 * provided waypoint IDs are not in the current selection, they will be added. If all
 * of the provided waypoint IDs are in the current selection, they will be removed.
 * Other selection types are unchanged.
 * @param state The store state
 * @param waypointIDs An array of waypoint IDs
 */
export function toggleWaypoints (state: RootState, waypointIDs: string[]): SelectionUpdate {

    // Get the current waypoint selection
    const selectedWaypointIDs = getSelectedWaypointIDs(state);

    // Get current selection state for waypoints that are toggling
    const waypointStates = getWaypointSelectionStatus(state, waypointIDs);

    // If every toggling waypoint is already selected, remove them all from the selection
    if (every(waypointStates)) {
        return {
            waypoints: deselectAllWaypoints(state)
        }
    }

    // Otherwise add the waypoints that aren't yet in the selection
    else {
        const addedWaypoints = compact(zip(waypointIDs, waypointStates).map(([waypointID, inSelection]) => inSelection ? undefined : waypointID));
        const hoveredWaypointID = getHoveredWaypointID(state);
        return {
            waypoints: {
                selection: [...selectedWaypointIDs, ...addedWaypoints],
                hover: hoveredWaypointID,
                updatedIDs: addedWaypoints,
                updatedSelectionStates: addedWaypoints.map(_ => true),
                updatedHoverStates: addedWaypoints.map(id => id === hoveredWaypointID)
            }
        }
    }

}