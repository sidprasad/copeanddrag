import { types } from "util";
import { RelativeOrientationConstraint } from "./layoutspec";

export interface LayoutGroup {
    // The name of the group
    name : string;

    // The nodes that are in the group
    nodeIds : string[];

    // The key node of the group
    keyNodeId : string;

    // Show label
    showLabel : boolean;
}

interface LayoutNode {
    id: string;
    color : string;
    groups?: string[];
    attributes?: Record<string, string[]>;
    icon? : string;
    width : number;
    height : number;
    mostSpecificType : string;
    types : string[];
    showLabels : boolean;
}


interface LayoutEdge {
    source: LayoutNode;
    target: LayoutNode;
    label: string;
    relationName : string;
    id : string;
}



export interface LayoutConstraint {
    
    sourceConstraint: RelativeOrientationConstraint; // This can be any type of constraint, so we use 'any' for now   
    
}
    //= TopConstraint | LeftConstraint | AlignmentConstraint;

export interface TopConstraint extends LayoutConstraint {
    top : LayoutNode;
    bottom : LayoutNode;
    minDistance : number;
}

// Add a typeguard for the constraint
export function isTopConstraint(constraint: LayoutConstraint): constraint is TopConstraint {
    return (constraint as TopConstraint).top !== undefined;
}

export interface LeftConstraint extends LayoutConstraint {
    left : LayoutNode;
    right : LayoutNode;
    minDistance : number;
}

export function isLeftConstraint(constraint: LayoutConstraint): constraint is LeftConstraint {
    return (constraint as LeftConstraint).left !== undefined;
}

// Same value along axis
export interface AlignmentConstraint extends LayoutConstraint {
    axis : "x" | "y";
    node1 : LayoutNode;
    node2 : LayoutNode;
}

export function isAlignmentConstraint(constraint: LayoutConstraint): constraint is AlignmentConstraint {
    return (constraint as AlignmentConstraint).axis !== undefined;
}




export { LayoutNode, LayoutEdge };



export interface InstanceLayout {
    nodes: LayoutNode[];
    edges: LayoutEdge[];
    constraints: LayoutConstraint[];
    groups: LayoutGroup[];
}