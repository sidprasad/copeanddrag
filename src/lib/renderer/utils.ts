/**
 * Utility functions for the renderer module
 * 
 * This module contains shared utility functions used throughout the rendering system,
 * including edge classification, constraint adjustments, and layout calculations.
 */
import { 
    Edge, 
    Node, 
    Constraint, 
    Group, 
    Point, 
    Rectangle, 
    BoundingBox, 
    GroupIndices, 
    ScaledConstraintsResult,
    LabelPosition
} from './types';

// Import geometry functions
export { adjustPointToRectanglePerimeter } from './geometry';

/** Layout iteration constants */
export const initialUnconstrainedIterations = 10; // unconstrained initial layout iterations
export const initialUserConstraintIterations = 100; // initial layout iterations with user-specified constraints
export const initialAllConstraintsIterations = 1000; // initial layout iterations with all constraints including non-overlap
export const gridSnapIterations = 5; // iterations of "grid snap", which pulls nodes towards grid cell centers

/** Spacing and margin constants */
export const margin = 10;
export const dy_for_linespacing = 5; // Adjust for spacing between lines

/**
 * Check if an edge is an inferred edge based on its ID
 * 
 * @param edge - The edge to check
 * @returns True if the edge is an inferred edge
 */
export function isInferredEdge(edge: Edge): boolean {
    const helperPrefix = "_inferred_";
    return edge.id.includes(helperPrefix);
}

/**
 * Check if an edge is a group edge based on its ID
 * 
 * @param edge - The edge to check
 * @returns True if the edge is a group edge
 */
export function isGroupEdge(edge: Edge): boolean {
    const groupPrefix = "_g_";
    return edge.id.startsWith(groupPrefix);
}

/**
 * Adjust link lengths and separation constraints based on scale factor
 * 
 * @param constraints - Array of layout constraints to adjust
 * @param scaleFactor - Scale factor to apply to constraints
 * @returns Object containing scaled constraints and calculated link length
 */
export function adjustLinkLengthsAndSeparationConstraintsToScaleFactor(
    constraints: Constraint[], 
    scaleFactor: number
): ScaledConstraintsResult {
    const adjustedScaleFactor = scaleFactor / 5;
    const min_sep = 150;
    const default_node_width = 100;

    const linkLength = (min_sep + default_node_width) / adjustedScaleFactor;

    /**
     * Create a new scaled constraints array
     */
    function getScaledConstraints(constraints: Constraint[]): Constraint[] {
        return constraints.map(constraint => {
            if (constraint.type === "separation" && typeof constraint.gap === "number") {
                const oldgap = constraint.gap;
                const newgap = oldgap / adjustedScaleFactor;
                
                return {
                    ...constraint,
                    gap: newgap 
                };
            }
            return constraint;
        });
    }

    return {
        scaledConstraints: getScaledConstraints(constraints),
        linkLength: linkLength
    };
}

/**
 * Parse group indices from edge ID
 * 
 * @param edgeId - Edge ID containing group indices in format _g_{groupOn}_{addToGroup}_
 * @returns Object containing parsed group indices
 * @throws Error if edge ID doesn't match expected pattern
 */
export function getGroupOnAndAddToGroupIndices(edgeId: string): GroupIndices {
    // Pattern _g_${groupOn}_${addToGroup}_
    const pattern = /_g_(\d+)_(\d+)_/;
    const match = edgeId.match(pattern);
    
    if (match) {
        const groupOnIndex = parseInt(match[1], 10);
        const addToGroupIndex = parseInt(match[2], 10);
        return { groupOnIndex, addToGroupIndex };
    } else {
        throw new Error(`Edge ID ${edgeId} does not match the expected pattern.`);
    }
}

/**
 * Generate a random offset along a path for edge positioning
 * 
 * @returns Random offset value between -10 and 10
 */
export function getRandomOffsetAlongPath(): number {
    return (Math.random() - 0.5) * 20; // Random offset between -10 and 10
}

/**
 * Calculate overlap area between two bounding boxes
 * 
 * @param bbox1 - First bounding box
 * @param bbox2 - Second bounding box
 * @returns Overlap area in square units (0 if no overlap)
 */
export function calculateOverlapArea(bbox1: BoundingBox, bbox2: BoundingBox): number {
    const x_overlap = Math.max(0, Math.min(bbox1.x + bbox1.width, bbox2.x + bbox2.width) - Math.max(bbox1.x, bbox2.x));
    const y_overlap = Math.max(0, Math.min(bbox1.y + bbox1.height, bbox2.y + bbox2.height) - Math.max(bbox1.y, bbox2.y));
    return x_overlap * y_overlap;
}

/**
 * Find groups that contain a given node (recursive search)
 * 
 * @param groups - Array of groups to search through
 * @param node - Node to find containing groups for
 * @returns Array of groups that contain the node
 */
export function getContainingGroups(groups: Group[], node: Node): Group[] {
    const containingGroups: Group[] = [];
    
    function findContainingGroups(currentNode: Node, groups: Group[], parents: Group[]): void {
        for (const group of groups) {
            const leaves = group.leaves.map(leaf => leaf.id);
            if (leaves.includes(currentNode.id)) {
                containingGroups.push(...parents, group);
                findContainingGroups(group as any, groups, [...parents, group]);
            }
        }
    }
    
    findContainingGroups(node, groups, []);
    return containingGroups;
}
