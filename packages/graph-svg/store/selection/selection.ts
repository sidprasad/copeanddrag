import { Vector2 } from '@graph-ts/vector2';

export type SelectionState = {

    // selected things
    edgeIDs: string[]
    nodeIDs: string[]
    waypointIDs: string[]

    // hovered things
    hoveredEdgeID: string | null
    hoveredNodeID: string | null
    hoveredWaypointID: string | null

    // selection drag offset
    dragOffset: Vector2

}

/**
 * An object containing hover/selection update data
 * for any type that is keyed by ID.
 */
export type SelectableUpdate = {

    // the new selection
    selection: string[]

    // the new hover target
    hover: string | null

    // an array of ids of items whose selection status changed as a result of the update
    updatedIDs: string[]

    // an array of new selection states for each updated item
    updatedSelectionStates: boolean[]

    // an array of new hovered states for each updated item
    updatedHoverStates: boolean[]

}

export type SelectionUpdate = {
    nodes?: SelectableUpdate
    edges?: SelectableUpdate
    waypoints?: SelectableUpdate
}

export const createSelectionState = (): SelectionState => {
    return {
        edgeIDs: [],
        nodeIDs: [],
        waypointIDs: [],
        hoveredEdgeID: null,
        hoveredNodeID: null,
        hoveredWaypointID: null,
        dragOffset: { x: 0, y: 0 }
    };
};