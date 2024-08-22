

export interface LayoutGroup {


    // The name of the group
    name : string;

    // The nodes that are in the group
    nodeIds : string[];

    // The key node of the group
    keyNodeId : string;
}

interface LayoutNode {
    id: string;
    color : string;
    groups?: string[];
    attributes?: Record<string, string[]>;
}


interface LayoutEdge {
    source: LayoutNode;
    target: LayoutNode;
    label: string;
    relationName : string;
    id : string;
}



export type LayoutConstraint = TopConstraint | LeftConstraint | AlignmentConstraint;

export interface TopConstraint {
    top : LayoutNode;
    bottom : LayoutNode;
    minDistance : number;
}

// Add a typeguard for the constraint
export function isTopConstraint(constraint: LayoutConstraint): constraint is TopConstraint {
    return (constraint as TopConstraint).top !== undefined;
}

export interface LeftConstraint {
    left : LayoutNode;
    right : LayoutNode;
    minDistance : number;
}

export function isLeftConstraint(constraint: LayoutConstraint): constraint is LeftConstraint {
    return (constraint as LeftConstraint).left !== undefined;
}

// Same value along axis
export interface AlignmentConstraint {
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