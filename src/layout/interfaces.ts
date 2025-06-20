import { types } from "util";
import { RelativeOrientationConstraint, CyclicOrientationConstraint } from "./layoutspec";

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
    color: string;
}

export class ImplicitConstraint {
    constructor(public c : RelativeOrientationConstraint | CyclicOrientationConstraint, public reason: string) {}

    toHTML(): string {
        let origHTML = this.c.toHTML();
        return `Implicit constraint ${origHTML} because ${this.reason}`;
    }
}

export interface LayoutConstraint {
    sourceConstraint: RelativeOrientationConstraint | CyclicOrientationConstraint | ImplicitConstraint; // Not grouping, and I hate introducing implicit (which should hopefully never show up)
}





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