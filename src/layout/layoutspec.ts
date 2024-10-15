
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
}

export interface IconDefinition extends sigDefinition {

    path : string;
    height : number;
    width : number;
}

const DEFAULT_LAYOUT : LayoutSpec = {
    fieldDirections: [],
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
        console.error("Failed to parse annotation spec, falling back on default layout.", error);
        return DEFAULT_LAYOUT;
    }
}