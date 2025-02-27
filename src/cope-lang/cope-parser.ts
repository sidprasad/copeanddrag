import { group } from 'console';
import { DEFAULT_LAYOUT, LayoutSpec, DirectionalRelation, SigDirection, ClusterRelation, AttributeDefinition, SigColor, ProjectionDefinition, ClosureDefinition, IconDefinition } from '../layout/layoutspec';

// Import js-yaml
import * as yaml from 'js-yaml';



const ORIENTATION_DIRECTIONS = ["above", "below", "left", "right", "directlyAbove", "directlyBelow", "directlyLeft", "directlyRight"];
const CYCLIC_DIRECTIONS = ["clockwise", "counterclockwise"];
const GROUP_TARGETS = ["domain", "range"];


const DEFAULT_FIELD_APPLIES_TO = ["univ", "univ"];

/*

constraints:
  - cyclic:
      field: left
      direction: clockwise

  - orientation:
      field: left
      directions: 
        - below
        - left

  - orientation:
      sigs:
        - A
        - B
      directions: 
        - right

  - group:
      field: relatedItems
      target: domain

directives:
  - icon:
      sig: Person
      icon:
        path: /icons/person.svg
        height: 50
        width: 50

  - color:
        sig: File
        value: "#FF5733"

  - attribute:
        field: value

  - projection:
      sig: Folder

  - flag: hideDisconnected


*/

export function copeToLayoutSpec(s: string): LayoutSpec {

    if (!s) {
        return DEFAULT_LAYOUT;
    }


    // First, parse the YAML
    let parsed = yaml.load(s);

    /*
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
    */




    // Now extract the constraints and directives
    let constraints = parsed.constraints;
    let directives = parsed.directives;



    let layoutSpec: LayoutSpec = {
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

    if (constraints) {
        try {
            let { closures, clusterRelations, fieldDirectionConstraints, sigOrientationConstraints } = extractConstraints(constraints);
            layoutSpec.closures = closures;
            layoutSpec.groupBy = clusterRelations;
            layoutSpec.fieldDirections = fieldDirectionConstraints;
            layoutSpec.sigDirections = sigOrientationConstraints;
        }
        catch (e) {
            throw new Error("Error parsing constraints.\n" + e.message);
        }
    }

    if (directives) {
        try {
            let { sigIcons, sigColors, attributeFields, sigProjections, hideDisconnected, hideDisconnectedBuiltIns } = extractDirectives(directives);
            layoutSpec.sigIcons = sigIcons;
            layoutSpec.sigColors = sigColors;
            layoutSpec.attributeFields = attributeFields;
            layoutSpec.projections = sigProjections;
            layoutSpec.hideDisconnected = hideDisconnected;
            layoutSpec.hideDisconnectedBuiltIns = hideDisconnectedBuiltIns;
        }

        catch (e) {
            throw new Error("Error parsing directives.\n" + e.message);
        }
    }
    return layoutSpec;
}


function extractConstraints(constraints: any[]): any {


    let closures: ClosureDefinition[] = constraints.filter(c => c.cyclic)
        .map(c => {
            let appliesTo = c.cyclic.appliesTo || DEFAULT_FIELD_APPLIES_TO;
            return {
                fieldName: c.cyclic.field,
                direction: c.cyclic.direction || "clockwise",
                appliesTo: appliesTo
            }
        });

    let clusterRelations: ClusterRelation[] = constraints.filter(c => c.group)
        .map(c => {
            let groupOn = c.group.target || "range";
            
            return {
                fieldName: c.group.field,
                groupOn: groupOn,
            }
        });

    let orientationConstraints = constraints.filter(c => c.orientation).map(c => c.orientation);
    let fieldDirectionConstraints: DirectionalRelation[] = orientationConstraints.filter(c => c.field)
        .map(c => {
            let appliesTo = c.cyclic.appliesTo || DEFAULT_FIELD_APPLIES_TO;
            return {
                fieldName: c.field,
                directions: c.directions,
                appliesTo: appliesTo
            }
        });


    let sigOrientationConstraints: SigDirection[] = orientationConstraints.filter(c => c.sigs)
        .map(c => {

            let source = c.sigs[0];
            let target = c.sigs[1];

            return {
                sigName: source,
                target: target,
                directions: c.directions
            }
        });


    //////

    for (let c of fieldDirectionConstraints) {
        for (let d of c.directions) {
            if (!ORIENTATION_DIRECTIONS.includes(d)) {
                throw new Error("Invalid orientation direction: " + d + " for field " + c.fieldName + ".\nValid directions are: " + ORIENTATION_DIRECTIONS.join(", "));
            }
        }
    }

    for (let c of sigOrientationConstraints) {
        for (let d of c.directions) {
            if (!ORIENTATION_DIRECTIONS.includes(d)) {
                throw new Error("Invalid orientation direction: " + d + " for sig " + c.sigName + ".\nValid directions are: " + ORIENTATION_DIRECTIONS.join(", "));
            }
        }
    }

    for (let c of closures) {
        if (!CYCLIC_DIRECTIONS.includes(c.direction)) {
            throw new Error("Invalid cyclic direction: " + c.direction + " for field " + c.fieldName + ".\nValid directions are: " + CYCLIC_DIRECTIONS.join(", "));
        }
    }

    // Cluster relations
    for (let c of clusterRelations) {
        if (!GROUP_TARGETS.includes(c.groupOn)) {
            throw new Error("Invalid group target: " + c.groupOn + " for field " + c.fieldName + ".\nValid targets are: " + GROUP_TARGETS.join(", "));
        }

    }

    //////


    return {
        closures,
        clusterRelations,
        fieldDirectionConstraints,
        sigOrientationConstraints
    }
}

function extractDirectives(directives: any[]): any {

    // Need to parse these

    // If there is no directive, each


    let icons = directives.filter(d => d.icon).map(d => d.icon);
    let attributes = directives.filter(d => d.attribute).map(d => d.attribute);
    let projections = directives.filter(d => d.projection).map(d => d.projection);
    let colors = directives.filter(d => d.color).map(d => d.color);
    let flags = directives.filter(d => d.flag).map(d => d.flag);

    let sigIcons: IconDefinition[] = icons.map(d => {
        return {
            sigName: d.sig,
            path: d.icon.path,
            height: d.icon.height,
            width: d.icon.width
        }
    });

    let sigColors: SigColor[] = colors
        .map(d => {
            return {
                sigName: d.sig,
                color: d.value
            }
        });

    let attributeFields: AttributeDefinition[] = attributes
        .map(d => {
            return {
                fieldName: d.field
            }
        });

    let sigProjections: ProjectionDefinition[] = projections
        .map(d => {
            return {
                sigName: d.sig
            }
        });

    let hideDisconnected = flags.includes("hideDisconnected");
    let hideDisconnectedBuiltIns = flags.includes("hideDisconnectedBuiltIns");


    return {
        sigIcons,
        sigColors,
        attributeFields,
        sigProjections,
        hideDisconnected,
        hideDisconnectedBuiltIns
    }
}