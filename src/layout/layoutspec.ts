
export type FieldDirection = "above" | "below" | "left" | "right" | "directlyAbove" | "directlyBelow" | "directlyLeft" | "directlyRight";
export type RotationDirection = "clockwise" | "counterclockwise";
export type ClusterTarget = "domain" | "range";


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



export interface DirectionalRelation extends fieldDefinition {
    directions : FieldDirection[];
    appliesTo: string[];
}

export interface SigDirection extends sigDefinition {
    target : sigDefinition;
    directions : FieldDirection[];
}

export interface ClusterRelation  extends fieldDefinition {
    groupOn? : ClusterTarget;
}

export interface AttributeDefinition extends fieldDefinition {}

export interface SigColor extends sigDefinition {
    color : string;
}

export interface ProjectionDefinition extends sigDefinition {}

export interface ClosureDefinition extends fieldDefinition {
    direction? : RotationDirection;
    appliesTo : string[];
}

export interface IconDefinition extends sigDefinition {

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