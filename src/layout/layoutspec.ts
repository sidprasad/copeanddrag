import * as yaml from 'js-yaml';

export type RelativeDirection = "above" | "below" | "left" | "right" | "directlyAbove" | "directlyBelow" | "directlyLeft" | "directlyRight";
export type RotationDirection = "clockwise" | "counterclockwise";
export type ClusterTarget = "domain" | "range";

export const DEFAULT_APPLIES_TO = "#t";
export const TEMPLATE_VAR_SRC = "<<SRC>>";
export const TEMPLATE_VAR_TGT = "<<TGT>>";


function randidentifier(len: number = 6): string {
    const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let result = "";
    for (let i = 0; i < len; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
    }
    return result;
}

/////////// COPE AND DRAG CORE ////////////

export interface Operation {}


export interface ConstraintOperation extends Operation {
    appliesTo? : string;
}



// So we have 3 kinds of constraint operations //

export interface RelativeOrientationConstraint extends ConstraintOperation {
    directions : RelativeDirection[];
}



//// TODO: Actually, do we have two kinds of grouping constraints now?

// Group by selector.
// Group bt field (with applies to)





export interface GroupBySelector {
    groupElementSelector : string;
    name: string;
}

export interface GroupByField extends ConstraintOperation {
    // And applies to selects the thing to group ON
    field : string;
}


export interface CyclicOrientationConstraint extends ConstraintOperation {
    direction : RotationDirection;
}


// And directive operations


export interface DirectiveOperation extends Operation {}

export interface VisualManipulation extends Operation {
    appliesTo? : string;
}

export interface AtomColorDirective extends VisualManipulation {
    color : string;
}

export interface AtomSizeDirective extends VisualManipulation {
    height : number;
    width : number;
}

export interface AtomIconDirective extends VisualManipulation {
    path : string;
}



// Right now, we don't support applies To on these.
export interface HidingDirective extends Operation {}


export interface AttributeDirective extends HidingDirective {

    field: string;

}
export interface ProjectionDirective extends HidingDirective {
    sig : string;
}

/////////////////////////////////////////////////

interface ConstraintsBlock 
{
    orientation : {
        relative: RelativeOrientationConstraint[];
        cyclic: CyclicOrientationConstraint[];
    };
    grouping : {
        byfield : GroupByField[];
        byselector : GroupBySelector[];
    }

}




export interface LayoutSpec {

    constraints: ConstraintsBlock

    directives : {
        colors: AtomColorDirective[];
        sizes: AtomSizeDirective[];
        icons: AtomIconDirective[];
        projections: ProjectionDirective[];
        attributes: AttributeDirective[];
        hideDisconnected : boolean;
        hideDisconnectedBuiltIns : boolean;
    }
}

const DEFAULT_LAYOUT : LayoutSpec = {
    constraints: {
        orientation: [],
        grouping: [],
        cyclic: []
    },
    directives: {
        colors: [],
        sizes: [],
        icons: [],
        projections: [],
        attributes: [],
        hideDisconnected: false,
        hideDisconnectedBuiltIns: true
    }
};



/////////// Now we also define some convenient SUGAR /////////


function fieldToPredicate(fieldName : string) : string {
    // I *think* this works because we always ONLY show the source and target in ...
    // This *may* be wrong. Need to think this through with a complex example and weirdly typed fields.
    
    // Assumption: This doesn't clash with the field name, the source node id or the target node id.
    let rid = randidentifier(6);
    return `some ${rid} : ${fieldName} | ((some ${TEMPLATE_VAR_SRC}.${rid}) and (some ${rid}.${TEMPLATE_VAR_TGT}))`;     
}


function sigToPredicate(sigName: string) : string {

    return `(${TEMPLATE_VAR_SRC} in ${sigName}) or (${TEMPLATE_VAR_TGT} in ${sigName})`;

}


// Field Directions //
class FieldDirections {
    fieldName : string;
    directions : RelativeDirection[];

    constructor(fieldName: string, directions: RelativeDirection[]) {
        this.fieldName = fieldName;
        this.directions = directions;
    }

    toCoreConstraint() : RelativeOrientationConstraint {
        let appliesTo : string = fieldToPredicate(this.fieldName);
        return {
            appliesTo: appliesTo,
            directions: this.directions
        };
    }

    static isFieldDirections(f: any): f is FieldDirections {
        return (
            typeof f === "object" &&
            f !== null &&
            typeof f.field === "string" &&
            Array.isArray(f.directions) &&
            f.directions.every((dir: any) =>
                ["above", "below", "left", "right", "directlyAbove", "directlyBelow", "directlyLeft", "directlyRight"].includes(dir)
            )
        );
    }

    static fromCnDObject(c: any): FieldDirections | undefined {

        let hasFields = c.orientation && c.orientation.field && c.orientation.directions;
        if(!hasFields && !FieldDirections.isFieldDirections(c)) {
            return undefined;
        }
        let fieldName = c.orientation.field;
        let directions = c.orientation.directions;

        return new FieldDirections(fieldName, directions);
    }

}


// Sig Directions //
class SigDirections {
    sigName : string;
    target : string;
    directions : RelativeDirection[];

    constructor(sigName: string, target: string, directions: RelativeDirection[]) {
        this.sigName = sigName;
        this.target = target;
        this.directions = directions;
    }

    toCoreConstraint() : RelativeOrientationConstraint {
        let appliesTo = `(${TEMPLATE_VAR_SRC} in ${this.sigName}) and (${TEMPLATE_VAR_TGT} in ${this.target})`;
        return {
            appliesTo: appliesTo,
            directions: this.directions
        }
    }

    static isSigDirections(f: any): f is SigDirections {
        return (
            typeof f === "object" &&
            f !== null &&
            typeof f.sigName === "string" &&
            typeof f.target === "string" &&
            Array.isArray(f.directions) &&
            f.directions.every((dir: any) =>
                ["above", "below", "left", "right", "directlyAbove", "directlyBelow", "directlyLeft", "directlyRight"].includes(dir)
            )
        );
    }


    static fromCnDObject(c: any): SigDirections | undefined {
        let hasFields = c.orientation && c.orientation.sigs && c.orientation.directions;
        if(!hasFields && !SigDirections.isSigDirections(c)) {
            return undefined;
        }
        let sigName = c.orientation.sigs[0];
        let target = c.orientation.sigs[1];
        let directions = c.orientation.directions;

        return new SigDirections(sigName, target, directions);
    }


}

class FieldTargetGroup  {
    field : string;
    groupOn? : ClusterTarget;
    showLabel? : boolean;


    constructor(field: string, groupOn?: ClusterTarget, showLabel?: boolean) {
        this.field = field;
        this.groupOn = groupOn;
        this.showLabel = showLabel;
    }

    toCoreConstraint() : GroupByField {
        let groupOnRelPart : string = this.groupOn || "range";
        // // TODO: DOuble check this
        // let v1 = randidentifier(6);
        // let groupOnExpr : string = (groupOnRelPart === "domain") ?
        // `{ ${v1} : univ | (some ${v1}.${this.field})  }`
        // : `{ ${v1} : univ | (some ${this.field}.${v1})  }`;        
        

        let appliesTo : string = (groupOnRelPart === "domain") ?
            `(some ${TEMPLATE_VAR_SRC}.${this.field})`
            : `(some ${this.field}.${TEMPLATE_VAR_TGT})`;
        
        return {
            appliesTo: appliesTo,
            field: this.field,
        };

    }

    static isGroupOnField(f: any): f is FieldTargetGroup {
        return (
            typeof f === "object" &&
            f !== null &&
            typeof f.field === "string" &&
            (f.groupOn === undefined || ["domain", "range"].includes(f.groupOn)) &&
            (f.showLabel === undefined || typeof f.showLabel === "boolean")
        );
    }

    static fromCnDObject(c: any): FieldTargetGroup | undefined {
        let hasFields = c.group && c.group.field;
        if(!hasFields && !FieldTargetGroup.isGroupOnField(c)) {
            return undefined;
        }
        let fieldName = c.group.field;
        let groupOn = c.group.target || "range";
        let showLabel = c.group.showLabel || false;

        return new FieldTargetGroup(fieldName, groupOn, showLabel);
    }

}

class FieldCyclic {
    field : string;
    direction? : RotationDirection;

    constructor(field: string, direction?: RotationDirection) {
        this.field = field;
        this.direction = direction;
    }


    toCoreConstraint() : CyclicOrientationConstraint {
        let appliesTo : string = fieldToPredicate(this.field);
        return {
            appliesTo: appliesTo,
            direction: this.direction || "clockwise"
        };
    }

    static isFieldCyclic(f: any): f is FieldCyclic {
        return (
            typeof f === "object" &&
            f !== null &&
            typeof f.field === "string" &&
            (f.direction === undefined || ["clockwise", "counterclockwise"].includes(f.direction))
        );
    }

    static fromCnDObject(c: any): FieldCyclic | undefined {
        let hasFields = c.cyclic && c.cyclic.field;
        if(!hasFields && !FieldCyclic.isFieldCyclic(c)) {
            return undefined;
        }
        let fieldName = c.cyclic.field;
        let direction = c.cyclic.direction || "clockwise";

        return new FieldCyclic(fieldName, direction);
    }
}


/////////
export function parseLayoutSpec(s: string): LayoutSpec {

    if (!s) {
        return DEFAULT_LAYOUT;
    }


    // First, parse the YAML
    let parsed = yaml.load(s);


    // Now extract the constraints and directives
    let constraints = parsed.constraints;
    let directives = parsed.directives;



    let layoutSpec: LayoutSpec = DEFAULT_LAYOUT;

    // Now we go through the constraints and directives and extract them


    if (constraints) {
        try {
          let constraintsParsed = parseConstraints(constraints);
          layoutSpec.constraints = constraintsParsed;
        }
        catch (e) {
            throw new Error("Error parsing constraints.\n" + e.message);
        }
    }

    if (directives) {
        try {
            let directivesParsed = parseDirectives(directives);
            layoutSpec.directives = directivesParsed;
        }

        catch (e) {
            throw new Error("Error parsing directives.\n" + e.message);
        }
    }
    return layoutSpec;
}

interface ConstrBlock : {
    ori
}

function parseConstraints(constraints: any[]):   ConstraintsBlock
{


    // All cyclic orientation constraints should start with 'cyclic'
    let cyclicConstraints: CyclicOrientationConstraint[] = constraints.filter(c => c.cyclic)
        .map(c => {
            
            let asFieldCyclic = FieldCyclic.fromCnDObject(c);
            if(asFieldCyclic) {
                return asFieldCyclic.toCoreConstraint();
            }
            // If not, we parse from the CORE constraint

            // TODO: Parse errors!

            if(!c.cyclic.appliesTo) {
                throw new Error("Cyclic constraint must have appliesTo field");
            }

            return {
                appliesTo: c.cyclic.appliesTo,
                direction: c.cyclic.direction || "clockwise"
            };

        });



    let relativeOrientationConstraints: RelativeOrientationConstraint[] = constraints.filter(c => c.orientation)
        .map(c => {
            let asFieldDirections = FieldDirections.fromCnDObject(c);
            if(asFieldDirections) {
                return asFieldDirections.toCoreConstraint();
            }

            let asSigDirections = SigDirections.fromCnDObject(c);
            if(asSigDirections) {
                return asSigDirections.toCoreConstraint();
            }

            // If not, we parse from the CORE constraint
            if(!c.orientation.appliesTo) {
                throw new Error("Orientation constraint must have appliesTo field");
            }

            if(!c.orientation.directions) {
                throw new Error("Orientation constraint must have directions field");
            }

            return {
                appliesTo: c.orientation.appliesTo,
                directions: c.orientation.directions
            }
        });


    let byfield: GroupByField[] = constraints.filter(c => c.group)
        .map(c => {
            let asGroupOnField = FieldTargetGroup.fromCnDObject(c);
            if(asGroupOnField) {
                return asGroupOnField.toCoreConstraint();
            }

            // If not, we parse from the CORE constraint
            if(!c.group.appliesTo) {
                throw new Error("Grouping constraint must have appliesTo field");
            }

            if(!c.group.field) {
                throw new Error("Grouping constraint must specify a field");
            }

            return {
                appliesTo: c.group.appliesTo,
                field: c.group.field,
            }
        });

    let byselector: GroupBySelector[] = constraints.filter(c => c.group)
        .map(c => {
            if(!c.group.elementSelector) {
                throw new Error("Grouping constraint must have an elementSelector.");
            }
            if(!c.group.name) {
                throw new Error("Grouping constraint must have a name.");
            }

            return {
                groupElementSelector: c.group.elementSelector,
                name: c.group.name
            }
        });

    return {
        orientation: {
            relative: relativeOrientationConstraints,
            cyclic: cyclicConstraints
        },
        grouping: {
            byfield: byfield,
            byselector: byselector
        }
    }

}

function parseDirectives(directives: any[]): {
                            colors: AtomColorDirective[];
                            sizes: AtomSizeDirective[];
                            icons: AtomIconDirective[];
                            projections: ProjectionDirective[];
                            attributes: AttributeDirective[];
                            hideDisconnected : boolean;
                            hideDisconnectedBuiltIns : boolean;
                        } 
{

    // CURRENTLY NO SUGAR HERE!

    let icons : AtomIconDirective[] = directives.filter(d => d.icon)
                .map(d => {

                    return {
                        path: d.path,
                        appliesTo: d.icon.appliesTo
                    }
                });
    let colors : AtomColorDirective[] = directives.filter(d => d.color)
                .map(d => {
                    return {
                        color: d.color.color,
                        appliesTo: d.color.appliesTo
                    }
                });

    let sizes : AtomSizeDirective[] = directives.filter(d => d.size)
                .map(d => {
                    return {
                        height: d.size.height,
                        width: d.size.width,
                        appliesTo: d.size.appliesTo
                    }
                });

    let attributes : AttributeDirective[]  = directives.filter(d => d.attribute).map(d => {
        return {
            field: d.attribute.field
        }
    });

    let projections : ProjectionDirective[] = directives.filter(d => d.projection).map(d => {
            return {
                sig: d.projection.sig
            }
        }
    );

    let flags = directives.filter(d => d.flag).map(d => d.flag);
    let hideDisconnected = flags.includes("hideDisconnected");
    let hideDisconnectedBuiltIns = flags.includes("hideDisconnectedBuiltIns");

    return {
        colors,
        sizes,
        icons,
        projections,
        attributes,
        hideDisconnected,
        hideDisconnectedBuiltIns
    }
}