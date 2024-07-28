
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
import { Graph } from 'graphlib';

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
}

export class LayoutInstance {

    private readonly _annotSpec : string;
    private readonly _layoutSpec: LayoutSpec;


    // Counter-intuitive, but this is how it should work.
    LEFT_CONSTRAINT : string = "_layoutRight";
    RIGHT_CONSTRAINT : string = "_layoutLeft";
    TOP_CONSTRAINT : string = "_layoutAbove";
    BOTTON_CONSTRAINT : string = "_layoutBelow";


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

    shouldClusterOnField(fieldId: string): boolean {
        const isMember = this._layoutSpec.groupBy.some((cluster) => cluster.fieldName === fieldId);
        return isMember;
    }

    /// This is trickier, will do "property"
    getAtomLayout(atomId: string): string[] {
        return [];
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

            // Check if the edge label is a groupBy field
            if (this.shouldClusterOnField(relName)) {

                // If so, add the targter as a group key,
                // and the source as a value in the group

                let source = edge.v;
                let target = edge.w;
                if (groups[target]) {
                    groups[target].push(source);
                }
                else {
                    groups[target] = [source];
                }

                // But also remove this edge from the graph,
                // and the source
                g.removeEdge(source, target);
                

            }
        });


        Object.keys(groups).forEach((key) => {
            g.removeNode(key);

        });

        return groups;
    }
}