export type FieldDirection = "above" | "below" | "left" | "right" | "directlyAbove" | "directlyBelow" | "directlyLeft" | "directlyRight";
export type RotationDirection = "clockwise" | "counterclockwise";
export type ClusterTarget = "domain" | "range";



// Properties on all top-level operations (constraints and directives).


export interface Operation {
    appliesTo? : string;
}


export interface fieldDefinition {
    fieldName : string;
}

export interface sigDefinition {
    sigName : string;
}

export interface LayoutSpec {
    fieldDirections : DirectionalRelation[];
    sigDirections : SigDirection[];
    groupBy : ClusterRelation[];
    attributeFields : AttributeDefinition[];
    hideDisconnected? : boolean;
    hideDisconnectedBuiltIns? : boolean;

    sigColors? : SigColor[];
    projections? : ProjectionDefinition[];
    closures? : ClosureDefinition[];
    sigIcons? : IconDefinition[];
}



export interface DirectionalRelation extends fieldDefinition, Operation {
    directions : FieldDirection[];
}

export interface SigDirection extends sigDefinition, Operation {
    target : sigDefinition;
    directions : FieldDirection[];
}

export interface ClusterRelation  extends fieldDefinition, Operation {
    groupOn? : ClusterTarget;
    showLabel? : boolean;
}

export interface AttributeDefinition extends fieldDefinition, Operation {}

export interface SigColor extends sigDefinition, Operation {
    color : string;
}

export interface ProjectionDefinition extends Omit<Operation, "appliesTo">, sigDefinition {}

export interface ClosureDefinition extends fieldDefinition, Operation {
    direction? : RotationDirection;
}

export interface IconDefinition extends sigDefinition, Operation {
    path : string;
    height : number;
    width : number;
}

export const DEFAULT_LAYOUT : LayoutSpec = {
    fieldDirections: [],
    sigDirections: [],
    groupBy: [],
    attributeFields: [],
    hideDisconnected: false,
    hideDisconnectedBuiltIns: true,
    sigColors: [],
    projections: [],
    sigIcons: []
};

export function parseLayoutSpec(spec : string) : LayoutSpec {

    if (!spec) {
        return DEFAULT_LAYOUT;
    }


    try {
        return JSON.parse(spec) as LayoutSpec;
    } catch (error) {
        console.error("USING default layout + DAGRE", error);
        return DEFAULT_LAYOUT;
    }
}