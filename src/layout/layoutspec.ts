import { all } from 'axios';
import * as yaml from 'js-yaml';

export type RelativeDirection = "above" | "below" | "left" | "right" | "directlyAbove" | "directlyBelow" | "directlyLeft" | "directlyRight";
export type RotationDirection = "clockwise" | "counterclockwise";
export type ClusterTarget = "domain" | "range";


//// THESE ONLY APPLY IN PREDICATE TYPE THINGS ///
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


class ConstraintOperation implements Operation {
    appliesTo: string;
    constructor(appliesTo: string) {
        this.appliesTo = appliesTo;
    }
    isInternallyConsistent(): boolean {
        // Default implementation, can be overridden by subclasses
        return true;
    }

    inconsistencyMessage(): string {
        return `Inconsistent Constraint Operation: ${this.appliesTo}`;  
    }
}



// So we have 3 kinds of constraint operations //

export class RelativeOrientationConstraint extends ConstraintOperation {
    directions : RelativeDirection[];

    constructor(directions: RelativeDirection[], appliesTo: string) {
        super(appliesTo);
        this.directions = directions;
    }
    
    override isInternallyConsistent(): boolean {

        // If "above" and  "below" are present, return false
        if (this.directions.includes("above") && this.directions.includes("below")) {
            return false;
        }

        // If "left" and "right" are present, return false
        if (this.directions.includes("left") && this.directions.includes("right")) {
            return false;
        }

        // If directlyLeft is present, the only other possible value should be left
        if (this.directions.includes("directlyLeft")) {
            // Ensure that all other values in the array are "left"
            if (!this.directions.every((direction) => direction === "left" || direction === "directlyLeft")) {
                return false;
            }
        }

        // If directlyRight is present, the only other possible value should be right
        if (this.directions.includes("directlyRight")) {
            // Ensure that all other values in the array are "right"
            if (!this.directions.every((direction) => direction === "right" || direction === "directlyRight")) {
                return false;
            }
        }

        // If directlyAbove is present, the only other possible value should be above
        if (this.directions.includes("directlyAbove")) {
            // Ensure that all other values in the array are "above"
            if (!this.directions.every((direction) => direction === "above" || direction === "directlyAbove")) {
                return false;
            }
        }

        // If directlyBelow is present, the only other possible value should be below
        if (this.directions.includes("directlyBelow")) {
            // Ensure that all other values in the array are "below"
            if (!this.directions.every((direction) => direction === "below" || direction === "directlyBelow")) {
                return false;
            }
        }
            return true;
        }


    override inconsistencyMessage(): string {
        let dirStr : string = this.directions.join(", ");
        return `Inconsistent Relative Orientation Constraint: Directions [${dirStr}] applied to: ${this.appliesTo}.`;  
    }
}


export interface GroupBySelector {
    groupElementSelector : string;
    name: string;
}


export interface GroupByField  {
    // And applies to selects the thing to group ON
    field : string;

    // And this is the element upon WHICH to group (ie. the key)
    groupOn : number;

    // And this is what gets grouped
    addToGroup : number;
}


export class CyclicOrientationConstraint extends ConstraintOperation {
    direction : RotationDirection;

    constructor(direction: RotationDirection, appliesTo: string) {
        super(appliesTo);
        this.direction = direction;
    }

    override inconsistencyMessage(): string {
        return `Inconsistent Cyclic Orientation Constraint: Direction ${this.direction} applied to: ${this.appliesTo}.`;  
    }
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
        orientation : {
            relative: [] as RelativeOrientationConstraint[],
            cyclic: [] as CyclicOrientationConstraint[]
        },
        grouping : {
            byfield : [] as GroupByField[],
            byselector : [] as GroupBySelector[]
        }
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



// Field Directions //
class FieldDirections extends RelativeOrientationConstraint {

    fieldName : string;

    constructor(fieldName: string, directions: RelativeDirection[]) {

        let appliesTo = fieldToPredicate(fieldName);
        super(directions, appliesTo);
        this.fieldName = fieldName;       

    }

    override inconsistencyMessage(): string {
        let dirStr : string = this.directions.join(", ");
        return `Field ${this.fieldName} cannot be laid out in directions [${dirStr}].`;  
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
class SigDirections extends RelativeOrientationConstraint { 
    sigName : string;
    target : string;


    constructor(sigName: string, target: string, directions: RelativeDirection[]) {
        let appliesTo = `(${TEMPLATE_VAR_SRC} in ${sigName}) and (${TEMPLATE_VAR_TGT} in ${target})`;
        super(directions, appliesTo);
        this.sigName = sigName;
        this.target = target;
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


    override inconsistencyMessage(): string {
        let dirStr : string = this.directions.join(", ");
        return `Sigs ${this.sigName} and ${this.target} cannot be ${dirStr} of one another.`;  
    }

}

/*
// This is wrong -- only works for binary relations.
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
        //let groupOnRelPart : string = this.groupOn || "range";
        // // TODO: DOuble check this
        // let v1 = randidentifier(6);
        // let groupOnExpr : string = (groupOnRelPart === "domain") ?
        // `{ ${v1} : univ | (some ${v1}.${this.field})  }`
        // : `{ ${v1} : univ | (some ${this.field}.${v1})  }`;        
        

        // let appliesTo : string = (groupOnRelPart === "domain") ?
        //     `(some ${TEMPLATE_VAR_SRC}.${this.field})`
        //     : `(some ${this.field}.${TEMPLATE_VAR_TGT})`;



        /////THis is wrong and only works for binary relations //
        // If domain --> 0
        // If range --> 1
        let gOn : number = (this.groupOn === "domain") ? 0 : 1;
        let gTo : number = (this.groupOn === "domain") ? 1 : 0;
        
        return {
            groupOn: gOn,
            addToGroup: gTo,
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
*/

class FieldCyclic extends CyclicOrientationConstraint{
    field : string;

    constructor(field: string, direction?: RotationDirection) {
        let appliesTo : string = fieldToPredicate(field);
        super(direction, appliesTo);
        this.field = field;
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

    override inconsistencyMessage(): string {
        return `Field ${this.field} cannot be laid out in direction ${this.direction}.`;  
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


function parseConstraints(constraints: any[]):   ConstraintsBlock
{


    let directionsByField : Record<string, RotationDirection> = {};

    let allFieldCyclic : FieldCyclic[] = constraints.filter(c => c.cyclic && FieldCyclic.isFieldCyclic(c))
    allFieldCyclic.forEach(c => {

        if (!directionsByField[c.field]) {
            directionsByField[c.field] = c.direction;
        }
        else if (directionsByField[c.field] !== c.direction) {
            throw new Error(`Inconsistent cyclic constraint for field ${c.field}: ${directionsByField[c.field]} vs ${c.direction}`);
        }
    });


    // All cyclic orientation constraints should start with 'cyclic'
    let cyclicConstraints: CyclicOrientationConstraint[] = constraints.filter(c => c.cyclic)
        .map(c => {
            
            if(!c.cyclic.appliesTo) {
                throw new Error("Cyclic constraint must have appliesTo field");
            }

            return new CyclicOrientationConstraint(
                c.cyclic.direction || "clockwise",
                c.cyclic.appliesTo
            );
        });



    let relativeOrientationConstraints: RelativeOrientationConstraint[] = constraints.filter(c => c.orientation)
        .map(c => {

            var isInternallyConsistent = true;

            let asFieldDirections = FieldDirections.fromCnDObject(c);
            if(asFieldDirections) {
                isInternallyConsistent = asFieldDirections.isInternallyConsistent();
                if(!isInternallyConsistent) {
                    throw new Error(asFieldDirections.inconsistencyMessage());
                }  
            }

            let asSigDirections = SigDirections.fromCnDObject(c);
            if(asSigDirections) {
                isInternallyConsistent = asSigDirections.isInternallyConsistent();
                if(!isInternallyConsistent) {
                    throw new Error(asSigDirections.inconsistencyMessage());
                }  
            }

            // If not, we parse from the CORE constraint
            if(!c.orientation.appliesTo) {
                throw new Error("Orientation constraint must have appliesTo field");
            }

            if(!c.orientation.directions) {
                throw new Error("Orientation constraint must have directions field");
            }

            let roc = new RelativeOrientationConstraint(
                c.orientation.directions,
                c.orientation.appliesTo
            );
            isInternallyConsistent = roc.isInternallyConsistent();
            if(!isInternallyConsistent) {
                throw new Error(roc.inconsistencyMessage());
            }
            return roc;
        });


    let byfield: GroupByField[] = constraints.filter(c => c.group)
        .filter(c => c.group.field)
        .map(c => {
            // let asGroupOnField = FieldTargetGroup.fromCnDObject(c);
            // if(asGroupOnField) {
            //     return asGroupOnField.toCoreConstraint();
            // }

            // If not, we parse from the CORE constraint
            if(c.group.groupOn == undefined) {
                throw new Error("Grouping constraint must have groupOn field");
            }

            if(c.group.field == undefined) {
                throw new Error("Grouping constraint must specify a field");
            }

            if(c.group.addToGroup == undefined) {
                throw new Error("Grouping constraint must specify addToGroup");
            }

            return {
                groupOn: c.group.groupOn,
                field: c.group.field,
                addToGroup: c.group.addToGroup,
            }
        });

    let byselector: GroupBySelector[] = constraints.filter(c => c.group)
        .filter(c => c.group.elementSelector)
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