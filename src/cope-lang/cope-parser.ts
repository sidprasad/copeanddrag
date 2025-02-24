import { DEFAULT_LAYOUT, LayoutSpec, DirectionalRelation, SigDirection, ClusterRelation, AttributeDefinition, SigColor, ProjectionDefinition, ClosureDefinition, IconDefinition } from '../layout/layoutspec';

// Import js-yaml
import * as yaml from 'js-yaml';


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
            throw new Error("Error parsing Cope and Drag constraints block." + e);
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
            throw new Error("Error parsing Cope and Drag directives block." + e);
        }
    }
    return layoutSpec;
}


function extractConstraints(constraints: any[]): any {


    let closures: ClosureDefinition[] = constraints.filter(c => c.cyclic)
        .map(c => {
            return {
                fieldName: c.cyclic.field,
                direction: c.cyclic.direction || "clockwise"
            }
        });

    let clusterRelations: ClusterRelation[] = constraints.filter(c => c.group)
        .map(c => {
            return {
                fieldName: c.group.field,
                groupOn: c.group.target
            }
        });

    let orientationConstraints = constraints.filter(c => c.orientation).map(c => c.orientation);
    let fieldDirectionConstraints: DirectionalRelation[] = orientationConstraints.filter(c => c.field)
        .map(c => {
            return {
                fieldName: c.field,
                directions: c.directions
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