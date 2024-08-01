
import { group } from 'console';
import { Graph, Edge } from 'graphlib';
import { AlloyInstance, getAtomType } from './alloy-instance';
import { isBuiltin } from './alloy-instance/src/type';




interface LayoutSpec {
    fieldDirections : DirectionalRelation[];
    groupBy : ClusterRelation[];
    attributeFields : AttributeDefinition[];
    hideDisconnected? : boolean;
    hideDisconnectedBuiltIns? : boolean;
}

interface DirectionalRelation {
    fieldName : string;
    directions : string[];
}

interface ClusterRelation {
    fieldName : string;
    groupOn? : string;
}


interface AttributeDefinition {
    fieldName : string;
}


export class LayoutInstance {

    private readonly _annotSpec : string;
    private readonly _layoutSpec: LayoutSpec;


    // Counter-intuitive, but this is how it should work.
    readonly LEFT_CONSTRAINT : string = "_layoutRight";
    readonly RIGHT_CONSTRAINT : string = "_layoutLeft";
    readonly TOP_CONSTRAINT : string = "_layoutAbove";
    readonly BOTTON_CONSTRAINT : string = "_layoutBelow";


    readonly DEFAULT_GROUP_ON : string = "range";
    readonly ATTRIBUTE_KEY : string = "attributes";



    constructor(annotationSpec : string) {
        this._annotSpec = annotationSpec;
        
        try {
            this._layoutSpec = JSON.parse(this._annotSpec) as LayoutSpec;
            // Now _layoutSpec is populated with the parsed data and can be used
        } catch (error) {
            console.error("Failed to parse annotation spec. Defaulting to no layout.", error);
            this._layoutSpec = {
                fieldDirections: [],
                groupBy: [],
                attributeFields: []
            };
        }
    }

    get hideDisconnected() : boolean {
        return this._layoutSpec.hideDisconnected || false;
    }

    get hideDisconnectedBuiltIns() : boolean {
        return this._layoutSpec.hideDisconnectedBuiltIns || false;
    }

    getFieldLayout(fieldId: string): string[] {
        
        const fieldDirection = this._layoutSpec.fieldDirections.find((field) => field.fieldName === fieldId);
        if (fieldDirection) {
            return fieldDirection.directions;
        }
        return [];
    }

    isAttributeField(fieldId: string): boolean {
        const isAttributeRel = this._layoutSpec.attributeFields.find((field) => field.fieldName === fieldId);
        return isAttributeRel ? true : false;
    }


    private getClusterSettings(fieldId: string): ClusterRelation | undefined {
        return this._layoutSpec.groupBy.find((cluster) => cluster.fieldName === fieldId);
    }



    private getGroupSourceAndTarget(edge : Edge, groupOn: string) {
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
    private generateGroups(g : Graph) : Record<string, string[]> {

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




    /**
     * Generates groups based on the specified graph.
     * @param g - The graph, which will be modified to remove the edges that are used to determine attributes.
     * @returns A record of attributes
     */   
    private generateAttributes(g : Graph) : Record<string, Record<string, string[]>> {

        // Node : [] of attributes
        let attributes :  Record<string, Record<string, string[]>> = {};

        let graphEdges = [...g.edges()];
        // Go through all edge labels in the graph

        graphEdges.forEach((edge) => {
            const edgeId = edge.name;
            const relName = g.edge(edge.v, edge.w, edgeId);
            const isAttributeRel = this.isAttributeField(relName);
            
            if (isAttributeRel) {

                // If the field is an attribute field, we should add the attribute to the source node's
                // attributes field.


                let source = edge.v;
                let target = edge.w;

                let nodeAttributes = attributes[source] || {};
                if (nodeAttributes[relName]) {
                    nodeAttributes[relName].push(target);
                }
                else {
                    nodeAttributes[relName] = [target];
                    attributes[source] = nodeAttributes;
                }
    
                
                // Now remove the edge from the graph
                g.removeEdge(edge.v, edge.w, edgeId);
            }
        });

        return attributes;
    }

     /**
     * Modifies the graph to remove extraneous nodes (ex. those to be hidden)
     * @param g - The graph, which will be modified to remove extraneous nodes.
     */
    private ensureNoExtraNodes(g : Graph, a : AlloyInstance) {

        let nodes = [...g.nodes()];

        // Built-ins :
        // Node types : isBuiltin
        a.types

        if (this.hideDisconnected) {
            nodes.forEach((node) => {


                // Check if builtin
                try {
                    const type = getAtomType(a, node);
                    const isAtomBuiltin = isBuiltin(type);

                    let inEdges = g.inEdges(node) || [];
                    let outEdges = g.outEdges(node) || [];
                    const isDisconnected = inEdges.length === 0 && outEdges.length === 0;


                    const hideNode = isDisconnected && ( (this.hideDisconnectedBuiltIns && isAtomBuiltin) || this.hideDisconnected );

                    if (hideNode) {
                        g.removeNode(node);
                    }

                } catch (error) {
                    console.error("Failed to identify node type. Defaulting to showing node.", error);
                }
            });
        }
        

    }



    /**
     * Generates a layout based on the specified graph.
     * @param g - The graph, which will be modified to remove extraneous nodes.
     * @param a - The AlloyInstance, which will be used to determine the types of nodes.
     * @returns A record of groups and attributes.
     */
    applyGraphChangesRequiredByLayout(g : Graph, a : AlloyInstance)  {

        // The order of things is important here.
        
        const attributes = this.generateAttributes(g);

        this.ensureNoExtraNodes(g, a);

        const groups = this.generateGroups(g);

        return {groups, attributes};
    }
}