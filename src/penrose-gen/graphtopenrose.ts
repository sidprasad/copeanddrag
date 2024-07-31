import { Graph, alg } from "graphlib";
import { LayoutInstance } from "../layoutinstance";
import { DOMAIN_TEMPLATE, STYLE_TEMPLATE, SUBSTANCE_TEMPLATE } from "./penrosetemplates";
import { AlloyInstance, AlloyType } from "../alloy-instance";
import { getAtomType } from "../alloy-instance/src/atom";
import { getInstanceTypes } from "../alloy-instance/src/instance";

export class PenroseInstance {

    // Unintuitive but correct
    LEFT_CONSTRAINT : string = "_layoutLeft";
    //RIGHT_CONSTRAINT : string = "_layoutRight";
    TOP_CONSTRAINT : string = "_layoutAbove";
    //BOTTOM_CONSTRAINT : string = "_layoutAbove";

    private readonly _graph : Graph;
    private readonly _layoutInstance : LayoutInstance;
    private readonly _groups : Record<string, string[]>;
    private readonly _alloyInstance : AlloyInstance;

    private readonly _nodesWithTypes : Record<string, AlloyType> = {};

    constructor(graph : Graph, layoutInstance : LayoutInstance, alloyInstance : AlloyInstance) {

        this._groups = layoutInstance.generateGroups(graph);
        this._layoutInstance = layoutInstance;
        this._graph = graph;
        this._alloyInstance = alloyInstance;
        this._nodesWithTypes = this._graph.nodes()
        //.filter(node => !this._groups[node]) // Assuming this is the correct check
                            .reduce((acc, node) => {
                                let type = getAtomType(this._alloyInstance, node);
                                acc[node] = type; // Assign the type to the node key in the accumulator
                                return acc; // Return the updated accumulator for the next iteration
                            }, {} as Record<string, AlloyType>); // Initialize the accumulator as an empty object
    }

    get domain(): string {
        return this.generateDomain();
    }

    get style(): string {
        return this.generateStyle();
    }

    get substance(): string {
        return this.generateSubstance();
    }



    generateDomain(): string {
        /*
         We should still define the order of the types.

         For each node, we need to define the type of the node (which we can get from the AlloyInstance)
         Then, we have to topologically sort the types, and then define the order of the types.

         Crucially, we need to avoid Cluster nodes (which we can do by checking if the node is in the groups keys)
         (or these have already been removed from the graph)
        */

        const BASE_TYPE = "_Vertex";
        const supertypeOP = "<:";

        let typeDAG = new Graph({ directed: true, multigraph: false });

        let allTypes = getInstanceTypes(this._alloyInstance);

        // Add the base type
        //typeDAG.setNode(BASE_TYPE);

        // Add all the types
        allTypes.forEach(type => {
            typeDAG.setNode(type.id);
        });


        // Now add the edges
        allTypes.forEach(type => {
            let supertypes = type.types;

            if (supertypes.length > 1) {
                // Only take the first supertype
                let supertype = supertypes[1];
                if (!typeDAG.hasEdge(type.id, supertype)) {
                    typeDAG.setEdge(supertype, type.id);
                }
            }
        });

        var nodeList = alg.topsort(typeDAG);
        //nodeList = nodeList.map (node => this.ensureValidId(node));


        let typeDefinitions : string [] = []
        for (let i = 0; i < nodeList.length; i++) {
            let superTypes = typeDAG.inEdges(nodeList[i]);

            let cleanedId = this.ensureValidId(nodeList[i]);

            // If no supertypes, then sdet the penrose base _Vertex as the supertype
            if (!superTypes || superTypes.length === 0) {
                
                typeDefinitions.push(`type ${cleanedId} ${supertypeOP} ${BASE_TYPE}`);
            }
            else {
                // Push all the supertypes
                superTypes.forEach(edge => {

                    let cleanedSupertype = this.ensureValidId(edge.v);
                    typeDefinitions.push(`type ${cleanedId} ${supertypeOP} ${cleanedSupertype}`);
                });
            }
        }
        
        let typeDefString = typeDefinitions.join("\n");




        return DOMAIN_TEMPLATE + "\n" + typeDefString;
    }

    generateStyle(): string {
        // TODO: This could be more sphisticated
        let style = STYLE_TEMPLATE;
        return style;
    }

    generateSubstance(): string {

        // The meat of the problem.
 

        


        let vertexDefinitions = this._graph.nodes().map(node => {


            let definedType = this._nodesWithTypes[node].types[0] || "_Vertex";
            let definedTypeCleaned = this.ensureValidId(definedType);

            // Ensure our IDs are supported by Penrose
            let nodeId = this.ensureValidId(node);

            // Instead of _Vertex, we should use the type of the node
            return `${definedTypeCleaned} ${nodeId}\nLabel ${nodeId} "${node}"`;
        });


        let linkDefinitions = this._graph.edges().map(edge => {
            let edgeLabel = this._graph.edge(edge.v, edge.w, edge.name);

            // Ensure our IDs are supported by Penrose
            let edgeId = this.ensureValidId(edge.name);

            let source = this.ensureValidId(edge.v);
            let target = this.ensureValidId(edge.w);

            return`_Link ${edgeId} := _Arc(${source}, ${target})\nLabel ${edgeId} "${edgeLabel}"`;
        });



        // Finally each _Cluster
        let clusterDefinitions = Object.keys(this._groups).map(clusterId => {
            let clusterName = this.ensureValidId(clusterId);
            return `_Cluster ${clusterName}\nLabel  ${clusterName} "${clusterId}"`;
        });

        // Now cluster membership
        let clusterMembership = Object.keys(this._groups).map(clusterId => {
            let clusterName = this.ensureValidId(clusterId);
            let members = this._groups[clusterId].map(member => 
            {
                let memberId = this.ensureValidId(member);
                return `_layoutInCluster(${clusterName}, ${memberId})`;
            });
            return members.join("\n");
        });


        // Cluster Non-Membership. TODO: Trickier and need to figure it out
        let clusterNonMembership = "";


        // Finally, the layout constraints
        let layoutConstraints = this._graph.edges().map(edge => {
            let edgeLabel = this._graph.edge(edge.v, edge.w, edge.name);
            let source = this.ensureValidId(edge.v);
            let target = this.ensureValidId(edge.w);

            let constraints = this._layoutInstance.getFieldLayout(edgeLabel).map(direction => {
                if (direction === "left") {

                    // The target should be to the left of the source
                    return `${this.LEFT_CONSTRAINT}(${target}, ${source})`;
                } else if (direction === "right") {
                    // The target should be to the right of the source
                    // ie the source should be to the left of the target
                    return `${this.LEFT_CONSTRAINT}(${source}, ${target})`;
                } else if (direction === "above") {
                    // the target should be above the source
                    return `${this.TOP_CONSTRAINT}(${target}, ${source})`;
                } else if (direction === "below") {
                    // the target should be below the source
                    return `${this.TOP_CONSTRAINT}(${source}, ${target})`;
                }
            });

            return constraints.join("\n");
        });



        //// TODO: THis is less than ideal though, since we do not preserve the
        /// heirarchies of the types. That is -- the PENROSE file is 
        /// less than ideal.
        /// In theory, we could do this with getTypeId and getAtomType

        let allConstraints: string[] = [SUBSTANCE_TEMPLATE, ...vertexDefinitions, ...linkDefinitions, ...clusterDefinitions, ...clusterMembership, ...clusterNonMembership, ...layoutConstraints];
        return allConstraints.join("\n");
    }



    private ensureValidId(id: string): string {
        if (!id) {
            return "";
        }

        /// If id starts with a number, we need to prepend it with an underscore
        if (id.match(/^\d/)) {
            id = "_" + id;
        }

        // Will have to be able to reverse engineer these so that we can get the original id back for
        // labels, cluster name, etc.

        return id
            .replace(/<:/g, "_field_").replace(/->/g, "_to_")
            .replace(/\$/g, "").replace(/\//g, "__").replace(/-/g, "_neg_")
            .replace(/>/g, "_gt_").replace(/</g, "_lt_").replace(/=/g, "_eq_")
            .replace(/:/g, "_c_").replace(/\./g, "_dot_").replace(/\?/g, "_q_");
    }
}