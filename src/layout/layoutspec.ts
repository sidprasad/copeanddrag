import * as yaml from 'js-yaml';

export type RelativeDirection = "above" | "below" | "left" | "right" | "directlyAbove" | "directlyBelow" | "directlyLeft" | "directlyRight";
export type RotationDirection = "clockwise" | "counterclockwise";
export type ClusterTarget = "domain" | "range";




/////////// COPE AND DRAG CORE ////////////

export interface Operation {}


class ConstraintOperation implements Operation {
    selector: string;
    constructor(selector: string) {
        this.selector = selector;
    }
    isInternallyConsistent(): boolean {
        // Default implementation, can be overridden by subclasses
        return true;
    }

    inconsistencyMessage(): string {
        return `Inconsistent Constraint Operation: ${this.selector}`;  
    }
}



// So we have 3 kinds of constraint operations //

export class RelativeOrientationConstraint extends ConstraintOperation {
    directions : RelativeDirection[];

    constructor(directions: RelativeDirection[], selector: string) {
        super(selector);
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
        return `Inconsistent Relative Orientation Constraint: Directions [${dirStr}] applied to: ${this.selector}.`;  
    }
}


export class GroupBySelector extends ConstraintOperation{
    name: string;

    constructor(selector : string, name: string) {
        super(selector);
        this.name = name;
    }
}


/*

    TODO: Could this be written with selectors (X, Y) and name --> edge name would have to be well 
    generated.

*/
export class GroupByField  {
    // And applies to selects the thing to group ON
    field : string;

    // And this is the element upon WHICH to group (ie. the key)
    groupOn : number;

    // And this is what gets grouped
    addToGroup : number;
    constructor(field: string, groupOn: number, addToGroup: number) {
        this.field = field;
        this.groupOn = groupOn;
        this.addToGroup = addToGroup;
    }
}







export class CyclicOrientationConstraint extends ConstraintOperation {
    direction : RotationDirection;

    constructor(direction: RotationDirection, selector: string) {
        super(selector);
        this.direction = direction;
    }

    override inconsistencyMessage(): string {
        return `Inconsistent Cyclic Orientation Constraint: Direction ${this.direction} applied to: ${this.selector}.`;  
    }
}


// And directive operations (TODO: THESE ALSO NEED TO BE SELECTORS!)

export interface DirectiveOperation extends Operation {}

export interface VisualManipulation extends Operation {
    selector : string;
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
    showLabels : boolean;
}

export interface InferredEdgeDirective extends VisualManipulation {
    name : string;
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
        inferredEdges: InferredEdgeDirective[];
        hideDisconnected : boolean;
        hideDisconnectedBuiltIns : boolean;
    }
}

function DEFAULT_LAYOUT() : LayoutSpec 
{

    return {
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
            inferredEdges: [],
            hideDisconnected: false,
            hideDisconnectedBuiltIns: false
        }
    };
}



/////////// Now we also define some convenient SUGAR /////////


// TODO: Lets ignore sugar for now.







/////////
export function parseLayoutSpec(s: string): LayoutSpec {

    if (!s) {
        return DEFAULT_LAYOUT();
    }


    // First, parse the YAML
    let parsed = yaml.load(s);


    // Now extract the constraints and directives
    let constraints = parsed.constraints;
    let directives = parsed.directives;



    let layoutSpec: LayoutSpec = DEFAULT_LAYOUT();

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


    // All cyclic orientation constraints should start with 'cyclic'
    let cyclicConstraints: CyclicOrientationConstraint[] = constraints.filter(c => c.cyclic)
        .map(c => {
            
            if(!c.cyclic.selector) {
                throw new Error("Cyclic constraint must have a selector");
            }

            return new CyclicOrientationConstraint(
                c.cyclic.direction || "clockwise",
                c.cyclic.selector
            );
        });


        let cyclicDirectionsBySelector : Record<string, RotationDirection> = {};

        cyclicConstraints.forEach(c => {
            let k = c.selector.trim();

            if (!cyclicDirectionsBySelector[k]) {
                cyclicDirectionsBySelector[k] = c.direction;
            }
            else if (cyclicDirectionsBySelector[k] !== c.direction) {
                throw new Error(`Inconsistent cyclic constraint for selector ${k}: ${cyclicDirectionsBySelector[k]}, ${c.direction}`);
            }
        });
    



    let relativeOrientationConstraints: RelativeOrientationConstraint[] = constraints.filter(c => c.orientation)
        .map(c => {

            var isInternallyConsistent = true;
            let constr = c.orientation as RelativeOrientationConstraint;


            // If not, we parse from the CORE constraint
            if(!constr.selector) {
                throw new Error("Orientation constraint must have selector field");
            }

            if(!constr.directions) {
                throw new Error("Orientation constraint must have directions field");
            }

            let roc = new RelativeOrientationConstraint(
                constr.directions,
                constr.selector
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


            return new GroupByField(
                c.group.field,
                c.group.groupOn,
                c.group.addToGroup
            );

            // return {
            //     groupOn: c.group.groupOn,
            //     field: c.group.field,
            //     addToGroup: c.group.addToGroup,
            // }
        });

    let byselector: GroupBySelector[] = constraints.filter(c => c.group)
        .filter(c => c.group.selector)
        .map(c => {
            if(!c.group.selector) {
                throw new Error("Grouping constraint must have a selector.");
            }
            if(!c.group.name) {
                throw new Error("Grouping constraint must have a name.");
            }
            return new GroupBySelector(c.group.selector, c.group.name);
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
                            inferredEdges: InferredEdgeDirective[];
                            hideDisconnected : boolean;
                            hideDisconnectedBuiltIns : boolean;
                        } 
{

    // CURRENTLY NO SUGAR HERE!

    let icons : AtomIconDirective[] = directives.filter(d => d.icon)
                .map(d => {

                    return {
                        path: d.icon.path,
                        selector: d.icon.selector,
                        showLabels: d.icon.showLabels || false 
                    }
                });
    let colors : AtomColorDirective[] = directives.filter(d => d.color)
                .map(d => {
                    return {
                        color: d.color.value,
                        selector: d.color.selector
                    }
                });

    let sizes : AtomSizeDirective[] = directives.filter(d => d.size)
                .map(d => {
                    return {
                        height: d.size.height,
                        width: d.size.width,
                        selector: d.size.selector
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

    let inferredEdges : InferredEdgeDirective[] = directives.filter(d => d.inferredEdge).map(d => {
        return {
            name: d.inferredEdge.name,
            selector: d.inferredEdge.selector
        }
    });

    return {
        colors,
        sizes,
        icons,
        projections,
        attributes,
        inferredEdges,
        hideDisconnected,
        hideDisconnectedBuiltIns
    }
}