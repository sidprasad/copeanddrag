
/*

    Example

    {
    // Field for layout
        'fieldDirections': {
            'left': ['above, left'],
            'right': ['above, right]'
        },

        // Fields that define clusters (aka field values that are used to group atoms)
        'groupBy': [],
        'sigIcons': [], // TODO: Implement this
    }



*/
import { group } from 'console';
import { Graph, Edge } from 'graphlib';

interface LayoutSpec {
    fieldDirections : DirectionalRelation[];
    groupBy : ClusterRelation[];
}

interface DirectionalRelation {
    fieldName : string;
    directions : string[];
}

interface ClusterRelation {
    fieldName : string;
    groupOn? : string;
}

export class LayoutInstance {

    private readonly _annotSpec : string;
    private readonly _layoutSpec: LayoutSpec;


    // Counter-intuitive, but this is how it should work.
    LEFT_CONSTRAINT : string = "_layoutRight";
    RIGHT_CONSTRAINT : string = "_layoutLeft";
    TOP_CONSTRAINT : string = "_layoutAbove";
    BOTTON_CONSTRAINT : string = "_layoutBelow";


    DEFAULT_GROUP_ON : string = "range";

    constructor(annotationSpec : string) {
        this._annotSpec = annotationSpec;
        
        try {
            this._layoutSpec = JSON.parse(this._annotSpec) as LayoutSpec;
            // Now _layoutSpec is populated with the parsed data and can be used
        } catch (error) {
            console.error("Failed to parse annotation spec. Defaulting to no layout.", error);
            this._layoutSpec = {
                fieldDirections: [],
                groupBy: []
            };
        }
    }



    getFieldLayout(fieldId: string): string[] {
        
        const fieldDirection = this._layoutSpec.fieldDirections.find((field) => field.fieldName === fieldId);
        if (fieldDirection) {
            return fieldDirection.directions;
        }
        return [];
    }

    // shouldClusterOnField(fieldId: string): boolean {
    //     const isMember = this._layoutSpec.groupBy.some((cluster) => cluster.fieldName === fieldId);
    //     return isMember;
    // }


    getClusterSettings(fieldId: string): ClusterRelation | undefined {
        return this._layoutSpec.groupBy.find((cluster) => cluster.fieldName === fieldId);
    }

    /// This is trickier, will do "property"
    getAtomLayout(atomId: string): string[] {
        return [];
    }



    getGroupSourceAndTarget(edge : Edge, groupOn: string) {
        
        let source = "";
        let target = "";

        if (groupOn === "domain") {
            source = edge.w;
            target = edge.v;
        } else if (groupOn == "range") {
            source = edge.v;
            target = edge.w;
        }
        else {
            // Default to range
            source = edge.v;
            target = edge.w;
        }

        return {source, target};
    }

    /**
     * Generates groups based on the specified graph.
     * @param g - The graph, which will be modified to remove the edges that are used to generate groups.
     * @returns A record of groups.
     */    
    generateGroups(g : Graph) : Record<string, string[]> {

        let groups : Record<string, string[]> = {};
        // Should we also remove the groups from the graph?

        let graphEdges = [...g.edges()];

        // Go through all edge labels in the graph
        graphEdges.forEach((edge) => {
            const edgeId = edge.name;
            const relName = g.edge(edge.v, edge.w, edgeId);

            // clusterSettings is defined only if the field should be used to group atoms
            const clusterSettings = this.getClusterSettings(relName);
            
            if (clusterSettings) {

                // If so, add the targter as a group key,
                // and the source as a value in the group

                // Check if clusterSettings has a groupOn field
                const groupOn = clusterSettings.groupOn || this.DEFAULT_GROUP_ON;

                let {source, target} = this.getGroupSourceAndTarget(edge, groupOn);
                if (groups[target]) {
                    groups[target].push(source);
                }
                else {
                    groups[target] = [source];
                }

                // But also remove this edge from the graph.
                g.removeEdge(edge.v, edge.w, edgeId);
                
            }
        });


        Object.keys(groups).forEach((key) => {
            g.removeNode(key);
        });

        return groups;
    }
}