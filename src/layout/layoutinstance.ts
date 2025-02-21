
import { Graph, Edge } from 'graphlib';
import { AlloyInstance, getAtomType, getInstanceTypes } from '../alloy-instance';
import { isBuiltin, AlloyType } from '../alloy-instance/src/type';
import { AlloyAtom } from '../alloy-instance/src/atom';
import { applyProjections } from '../alloy-instance/src/projection';
import { IconDefinition } from './layoutspec';
import { LayoutSpec, ClosureDefinition, ClusterRelation, parseLayoutSpec, SigDirection } from './layoutspec';
import { LayoutNode, LayoutEdge, LayoutConstraint, InstanceLayout, LeftConstraint, TopConstraint, AlignmentConstraint, LayoutGroup } from './interfaces';

import { generateGraph } from '../alloy-graph';

import { ColorPicker } from './colorpicker';



export class LayoutInstance {


    readonly hideThisEdge = "_h_"
    readonly DEFAULT_NODE_ICON_PATH: string = null;
    readonly DEFAULT_NODE_HEIGHT = 60;
    readonly DEFAULT_NODE_WIDTH = 100;

    private readonly _layoutSpec: LayoutSpec;
    readonly DEFAULT_GROUP_ON: string = "range";

    private readonly _sigColors: Record<string, string>;

    private readonly _sigIcons: Record<string, IconDefinition>;

    public readonly minSepHeight = 15;
    public readonly minSepWidth = 15;


    constructor(layoutSpec: LayoutSpec) {
        this._layoutSpec = layoutSpec;

        this._sigColors = {};
        if (this._layoutSpec.sigColors) {
            this._layoutSpec.sigColors.forEach((sigColor) => {
                this._sigColors[sigColor.sigName] = sigColor.color;
            });
        }

        this._sigIcons = {};
        if (this._layoutSpec.sigIcons) {
            this._layoutSpec.sigIcons.forEach((sigIcon) => {
                this._sigIcons[sigIcon.sigName] = sigIcon;
            });
        }



        if (this._layoutSpec.closures) {
            this._layoutSpec.closures.forEach((closure) => {
                if (!closure.direction) {
                    closure.direction = "clockwise";
                }
            });
        }
    }


    public checkConstraintConsistency() : { consistent: boolean, error : string} {
        let sigDirections = this._layoutSpec.sigDirections || [];
        let fieldDirections = this._layoutSpec.fieldDirections || [];
        
        // We will have to get to this at some point. Hopefully the parser 



        function areDirectionsConsistent(directions : string[]) : boolean {

            // If "above" and  "below" are present, return false
            if (directions.includes("above") && directions.includes("below")) {
                return false;
            }

            // If "left" and "right" are present, return false
            if (directions.includes("left") && directions.includes("right")) {
                return false;
            }

            // If directlyLeft is present, the only other possible value should be left
            if (directions.includes("directlyLeft")) {
                // Ensure that all other values in the array are "left"
                if (!directions.every((direction) => direction === "left" || direction === "directlyLeft")) {
                    return false;
                }
            }

            // If directlyRight is present, the only other possible value should be right
            if (directions.includes("directlyRight")) {
                // Ensure that all other values in the array are "right"
                if (!directions.every((direction) => direction === "right" || direction === "directlyRight")) {
                    return false;
                }
            }

            // If directlyAbove is present, the only other possible value should be above
            if (directions.includes("directlyAbove")) {
                // Ensure that all other values in the array are "above"
                if (!directions.every((direction) => direction === "above" || direction === "directlyAbove")) {
                    return false;
                }
            }

            // If directlyBelow is present, the only other possible value should be below
            if (directions.includes("directlyBelow")) {
                // Ensure that all other values in the array are "below"
                if (!directions.every((direction) => direction === "below" || direction === "directlyBelow")) {
                    return false;
                }
            }
            return true;
        }



        // First check that all sigDirections are consistent
        for (let i = 0; i < sigDirections.length; i++) {
            let sigDirection = sigDirections[i];
            let sourceSig = sigDirection.sigName;
            let targetSig = sigDirection.target.sigName;
            let directions = sigDirection.directions || [];

            if (!areDirectionsConsistent(directions)) {
                let directionsString = directions.join(", ");
                return { consistent: false, error: `Inconsistent orientation constraint: Sigs <code>${sourceSig}</code> and <code>${targetSig}</code> cannot have relative directions: <code>${directionsString}</code>.` };
            }
        }

        // Then check that all fieldDirections are consistent
        for (let i = 0; i < fieldDirections.length; i++) {
            let fieldDirection = fieldDirections[i];
            let fieldName = fieldDirection.fieldName;
            let directions = fieldDirection.directions || [];

            if (!areDirectionsConsistent(directions)) {
                let directionsString = directions.join(", ");
                return { consistent: false, error: `Inconsistent orientation constraint:  Field <code>${fieldName}</code> cannot be laid out with directions: <code>${directionsString}</code>.` };
            }
        }


        let closures = this._layoutSpec.closures || [];

        // Build a map of field names to flow, using closures
        let fieldToFlow = {};
        for (let i = 0; i < closures.length; i++) {
            let closure = closures[i];
            let fieldName = closure.fieldName;
            let direction = closure.direction;

            if (fieldToFlow[fieldName] && fieldToFlow[fieldName] !== direction) {
                return { consistent: false, error: `Inconsistent cyclic constraints: Field ${fieldName} cannot be laid out ${direction} and ${fieldToFlow[direction]}.` };
            }
            fieldToFlow[fieldName] = direction;
        }
        


        return { consistent: true, error: ""};
    }


    get projectedSigs(): string[] {
        if (!this._layoutSpec.projections) {
            return [];
        }
        return this._layoutSpec.projections.map((projection) => projection.sigName);
    }

    get hideDisconnected(): boolean {
        return this._layoutSpec.hideDisconnected || false;
    }

    get hideDisconnectedBuiltIns(): boolean {
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



    private getGroupSourceAndTarget(edge: Edge, groupOn: string) {
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
        return { source, target };
    }

    /**
     * Generates groups based on the specified graph.
     * @param g - The graph, which will be modified to remove the edges that are used to generate groups.
     * @returns A record of groups.
     */
    private generateGroups(g: Graph): LayoutGroup[] {

        let groups: LayoutGroup[] = [];
        // Should we also remove the groups from the graph?

        let graphEdges = [...g.edges()];

        // Go through all edge labels in the graph
        graphEdges.forEach((edge) => {
            const edgeId = edge.name;
            const relName = this.getRelationName(g, edge);


            // clusterSettings is defined only if the field should be used to group atoms
            const clusterSettings = this.getClusterSettings(relName);

            if (clusterSettings) {
                // Default to range, but check what is being grouped on.
                const groupOn = clusterSettings.groupOn || this.DEFAULT_GROUP_ON;
                let { source, target } = this.getGroupSourceAndTarget(edge, groupOn);
                let groupName = target + ":" + this.getEdgeLabel(g, edge);

                // Check if the group already exists
                let existingGroup: LayoutGroup = groups.find((group) => group.name === groupName);

                const edgeLabel = this.getEdgeLabel(g, edge);
                if (existingGroup) {
                    existingGroup.nodeIds.push(source);
                    // But also remove this edge from the graph.
                    g.removeEdge(edge.v, edge.w, edgeId);


                    /// WHAT IF WE WANT TO KEEP THE EDGE?


                    const newId = this.hideThisEdge + edgeId;
                    // Maybe remove the edge and then add it again.
                    g.removeEdge(edge.v, edge.w, edgeId);
                    g.setEdge(edge.v, edge.w, edgeLabel, newId);


                    //////////////////////////


                }
                else {

                    let newGroup: LayoutGroup =
                    {
                        name: groupName,
                        nodeIds: [source],
                        keyNodeId: target
                    };
                    groups.push(newGroup);
                    // HACK: Don't remove the FIRST edge connecting node to group, we can respect SOME spatiality?





                    const groupEdgePrefix = "_g_"
                    const newId = groupEdgePrefix + edgeId;
                    // Maybe remove the edge and then add it again.
                    g.removeEdge(edge.v, edge.w, edgeId);
                    g.setEdge(edge.v, edge.w, edgeLabel, newId);


                }
            }
        });

        return groups;
    }




    /**
     * Generates groups based on the specified graph.
     * @param g - The graph, which will be modified to remove the edges that are used to determine attributes.
     * @returns A record of attributes
     */
    private generateAttributes(g: Graph): Record<string, Record<string, string[]>> {

        // Node : [] of attributes
        let attributes: Record<string, Record<string, string[]>> = {};

        let graphEdges = [...g.edges()];
        // Go through all edge labels in the graph

        graphEdges.forEach((edge) => {
            const edgeId = edge.name;
            const relName = this.getRelationName(g, edge);
            const isAttributeRel = this.isAttributeField(relName);

            if (isAttributeRel) {

                // If the field is an attribute field, we should add the attribute to the source node's
                // attributes field.

                const attributeKey = this.getEdgeLabel(g, edge);
                let source = edge.v;
                let target = edge.w;

                let nodeAttributes = attributes[source] || {};

                if (!nodeAttributes[attributeKey]) {
                    nodeAttributes[attributeKey] = [];
                    attributes[source] = nodeAttributes;
                }
                nodeAttributes[attributeKey].push(target);

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
    private ensureNoExtraNodes(g: Graph, a: AlloyInstance) {

        let nodes = [...g.nodes()];


        nodes.forEach((node) => {


            // Check if builtin
            try {
                const type = getAtomType(a, node);
                const isAtomBuiltin = isBuiltin(type);

                let inEdges = g.inEdges(node) || [];
                let outEdges = g.outEdges(node) || [];
                const isDisconnected = inEdges.length === 0 && outEdges.length === 0;


                const hideNode = isDisconnected && ((this.hideDisconnectedBuiltIns && isAtomBuiltin) || this.hideDisconnected);

                if (hideNode) {
                    g.removeNode(node);
                }

            } catch (error) {
                console.error("Failed to identify node type. Defaulting to showing node.", error);
            }
        });
    }



    private colorNodesByType(g: Graph, a: AlloyInstance): Record<string, string> {


        let nodes = [...g.nodes()];
        let types = getInstanceTypes(a);
        let colorPicker = new ColorPicker(types.length);


        // Ensure that we have colors that are NOT in the sigColors
        let usedColors = Object.values(this._sigColors);
        
        let colorsByType: Record<string, string> = {};
        let types_with_user_colors = Object.keys(this._sigColors);

  
        types.forEach((type, index) => {
            // If the type has a color specified, use that
            if (this._sigColors[type.id]) {
                colorsByType[type.id] = this._sigColors[type.id];
            }
            else {
                // But we want to make sure that the phylo color is not already in use.
                colorsByType[type.id] = colorPicker.getNextColor();
            }
        });


        let colorsByNode = {};
        nodes.forEach((node) => {
            // Get the type of the node
            let type = getAtomType(a, node);
            let allTypes = type.types;


            // Get the first element of allTypes that 
            // is also an element of types_with_user_colors
            let type_id = allTypes.find((type) => types_with_user_colors.includes(type)) || type.id;
            let color = colorsByType[type_id];
            colorsByNode[node] = color;
        });
        return colorsByNode;
    }


    public getRelationName(g: Graph, edge: Edge): string {
        let relNameRaw = this.getEdgeLabel(g, edge);
        let relName = relNameRaw.split("[")[0];
        return relName;
    }

    private getEdgeLabel(g: Graph, edge: Edge): string {
        return g.edge(edge.v, edge.w, edge.name);
    }


    public getClosures(): ClosureDefinition[] {
        if (!this._layoutSpec.closures) {
            return [];
        }
        return this._layoutSpec.closures;
    }




    private applyLayoutProjections(ai: AlloyInstance, projections: Record<string, string>): { projectedInstance: AlloyInstance, finalProjectionChoices: { type: string, projectedAtom: string, atoms: string[] }[] } {

        let projectedSigs: string[] = this.projectedSigs;
        let projectedTypes: AlloyType[] = projectedSigs.map((sig) => ai.types[sig]);


        // Now we should have a map from each type to its atoms
        let atomsPerProjectedType: Record<string, string[]> = {};
        projectedTypes.forEach((type) => {
            atomsPerProjectedType[type.id] = type.atoms.map((atom) => atom.id);
        });




        let projectedAtomIds: string[] = [];

        Object.entries(atomsPerProjectedType).forEach(([typeId, atomIds]) => {


            // TODO: Here, we need to actually get a user to select the atom from a dropdown. If none is selected, we should default to the first atom.

            if (atomIds.length > 0) {


                // Check if projections[typeId] exists
                if (projections[typeId]) {
                    projectedAtomIds.push(projections[typeId]);
                }
                else {
                    let to_project = atomIds[0];
                    projections[typeId] = to_project;
                    projectedAtomIds.push(to_project);
                }
            }
        });

        // finalProjectionChoices : { type : string, projectedAtom : string, atoms : string[]} 
        let finalProjectionChoices = Object.entries(projections)
        
        .filter(([typeId, atomId]) => projectedSigs.includes(typeId)) // This is crucial for scenarios where the projection is changed.
        
        .map(([typeId, atomId]) => {
            let atoms = atomsPerProjectedType[typeId];
            return { type: typeId, projectedAtom: atomId, atoms: atoms };
        });

        let projectedInstance = applyProjections(ai, projectedAtomIds);
        return { projectedInstance, finalProjectionChoices };
    }



    public generateLayout(a: AlloyInstance, projections: Record<string, string>): { layout: InstanceLayout, projectionData: { type: string, projectedAtom: string, atoms: string[] }[] } {

        let projectionResult = this.applyLayoutProjections(a, projections);

        let ai = projectionResult.projectedInstance;
        let projectionData = projectionResult.finalProjectionChoices;

        let g: Graph = generateGraph(ai, this.hideDisconnected, this.hideDisconnectedBuiltIns);

        const attributes = this.generateAttributes(g);
        const groups = this.generateGroups(g);
        const colors = this.colorNodesByType(g, a);

        this.ensureNoExtraNodes(g, a);



        let layoutNodes: LayoutNode[] = g.nodes().map((nodeId) => {

            let type = getAtomType(a, nodeId);
            let iconPath: string = this._sigIcons[type.id] ? this._sigIcons[type.id].path : this.DEFAULT_NODE_ICON_PATH;
            const nodeHeight = this._sigIcons[type.id] ? this._sigIcons[type.id].height : this.DEFAULT_NODE_HEIGHT;
            const nodeWidth = this._sigIcons[type.id] ? this._sigIcons[type.id].width : this.DEFAULT_NODE_WIDTH;

            // TODO: ensure that iconPath exists



            let color = colors[nodeId];
            let nodeGroups = groups
                .filter((group) => group.nodeIds.includes(nodeId))
                .map((group) => group.name);
            let nodeAttributes = attributes[nodeId] || {};
            return {
                id: nodeId,
                color: color,
                groups: nodeGroups,
                attributes: nodeAttributes,
                icon: iconPath,
                height: nodeHeight,
                width: nodeWidth
            };
        });


        let constraints: LayoutConstraint[] = this.applySigConstraints(ai, layoutNodes);

        // Now we apply the closure constraints
        let closureConstraints = this.applyClosureConstraints(g, layoutNodes, groups);
        // Append the closure constraints to the constraints
        constraints = constraints.concat(closureConstraints);


        // Now edges and relational constraints
        let layoutEdges: LayoutEdge[] = g.edges().map((edge) => {
            const edgeId = edge.name;
            const edgeLabel: string = g.edge(edge.v, edge.w, edgeId);

            let source = layoutNodes.find((node) => node.id === edge.v);
            let target = layoutNodes.find((node) => node.id === edge.w);
            let relName = this.getRelationName(g, edge);


            this.getFieldLayout(relName).forEach((direction) => {
                if (direction === "left") {
                    constraints.push(this.leftConstraint(target.id, source.id, this.minSepWidth, layoutNodes));
                }
                else if (direction === "above") {
                    constraints.push(this.topConstraint(target.id, source.id, this.minSepHeight, layoutNodes));
                }
                else if (direction === "right") {
                    constraints.push(this.leftConstraint(source.id, target.id, this.minSepWidth, layoutNodes));
                }
                else if (direction === "below") {
                    constraints.push(this.topConstraint(source.id, target.id, this.minSepHeight, layoutNodes));
                }
                else if (direction === "directlyLeft") {
                    constraints.push(this.leftConstraint(target.id, source.id, this.minSepWidth, layoutNodes));
                    constraints.push(this.ensureSameYConstraint(target.id, source.id, layoutNodes));
                }
                else if (direction === "directlyAbove") {
                    constraints.push(this.topConstraint(target.id, source.id, this.minSepHeight, layoutNodes));
                    constraints.push(this.ensureSameXConstraint(target.id, source.id, layoutNodes));
                }
                else if (direction === "directlyRight") {
                    constraints.push(this.leftConstraint(source.id, target.id, this.minSepWidth, layoutNodes));
                    constraints.push(this.ensureSameYConstraint(target.id, source.id, layoutNodes));
                }
                else if (direction === "directlyBelow") {
                    constraints.push(this.topConstraint(source.id, target.id, this.minSepHeight, layoutNodes));
                    constraints.push(this.ensureSameXConstraint(target.id, source.id, layoutNodes));
                }
            });

            let e: LayoutEdge = {
                source: source,
                target: target,
                label: edgeLabel,
                relationName: relName,
                id: edgeId
            };
            return e;
        });


        // Filter out all edges that are hidden
        layoutEdges = layoutEdges.filter((edge) => !edge.id.startsWith(this.hideThisEdge));


        let layout = { nodes: layoutNodes, edges: layoutEdges, constraints: constraints, groups: groups };
        return { layout, projectionData };
    }


    applyClosureConstraints(g: Graph, layoutNodes: LayoutNode[], groups: LayoutGroup[]): LayoutConstraint[] {

        const closures = this.getClosures();

        let constraints = closures.map((closure) => {
            return this.applyClosureConstraintWithoutACentroid(g, layoutNodes, closure.fieldName, closure.direction, groups);
        });

        return constraints.flat();

    }

    applyClosureConstraintWithoutACentroid(g: Graph, layoutNodes: LayoutNode[], relName: string, direction: string, groups: LayoutGroup[]): LayoutConstraint[] {
        let direction_mult: number = 0;
        if (direction === "clockwise") {
            direction_mult = 1;
        }
        else if (direction === "counterclockwise") {
            direction_mult = -1; // IS THIS RIGHT OR THE OTHER WAY?
        }

        let relationEdges = g.edges().filter(edge => {
            return this.getRelationName(g, edge) === relName;
        });

        if (relationEdges.length === 0) { return []; }

        let relatedNodeFragments = this.orderNodesByEdges(relationEdges);
        var fragment_num = 0;



     

        let constraints: LayoutConstraint[] = [];
        relatedNodeFragments.forEach((relatedNodes) => {
            const minRadius = 100; // Example fixed distance. This needs to change.

            // One thing we dont have here is PREVENTING FRAGMENTS FROM OVERLAPPING


            const angleStep = (direction_mult * 2 * Math.PI) / relatedNodes.length;
            //let index = 0;




            // There is actually more to do here. if they are laid out, the nodes must
            // ALSO not be to the left or right one another.
            // What this means is an alternative impl, where it has to do with 'x', 'y'.


            // So in order:
            /*


                we have 5 nodes we need to arrange in a regular shape (with min distance 100)

                - First lay them all out in reference to a centroid.


                - Then in order, determine which nodes are to the left/right of one another.

                // For instance, if we start from the left. The first node should be to the left of the second node, and NOT above it.

                // But, this changes every 90 degrees. So the angle matters.

                // If the angle is between 0 and 90: each node should be to the left and below the next node.
                // If the angle is between 90 and 180: each node should be to the left of and above the next node.
                // If the angle is between 180 and 270: each node should be to the right of and above the next node.
                // If the angle is between 270 and 360: each node should be to the right of and below the next node.

                // However, there are phase transitions right? Rather, we might want to maintain this for things like say, a square.

            */

            for (var i = 0; i < relatedNodes.length; i++) {

                let next_node_idx = (i + 1) % relatedNodes.length;
                let node = relatedNodes[i];
                let next_node = relatedNodes[next_node_idx];


                // Get the angle between the two nodes
                let current_node_theta = i * angleStep;
                let next_node_theta = next_node_idx * angleStep;

                // This is a notional computation, where 
                // we assume a circle of radius minRadius
                let current_node_x = minRadius * Math.cos(current_node_theta);
                let current_node_y = minRadius * Math.sin(current_node_theta);

                let next_node_x = minRadius * Math.cos(next_node_theta);
                let next_node_y = minRadius * Math.sin(next_node_theta);

                // Now we need to determine the direction of the nodes
                // relative to one another.
                if(current_node_x > next_node_x) {
                    constraints.push(this.leftConstraint(next_node, node, this.minSepWidth, layoutNodes));
                }
                // HMM. Should this be <= or just an else?
                else {
                    constraints.push(this.leftConstraint(node, next_node, this.minSepWidth, layoutNodes));
                }

                if(current_node_y > next_node_y) {
                    constraints.push(this.topConstraint(node, next_node, this.minSepHeight, layoutNodes));
                }
                else {
                    constraints.push(this.topConstraint(next_node, node, this.minSepHeight, layoutNodes));
                }
            }




        });

        return constraints;
    }



    applySigConstraints(ai: AlloyInstance, layoutNodes: LayoutNode[]): LayoutConstraint[] {

        let constraints: LayoutConstraint[] = [];
        let sigDirections = this._layoutSpec.sigDirections || [];
        let nodeTypes = getInstanceTypes(ai);

        sigDirections.forEach((sigDirection) => {
            let sourceType = nodeTypes.find((type) => type.id === sigDirection.sigName);

            // This is a hack, something is wrong with the types.
            let targetType = nodeTypes.find((type) => {
                
                // First check if sigDirection.target is a string
                if (typeof sigDirection.target === "string") {
                    return type.id === sigDirection.target;
                }
                return type.id === sigDirection.target.sigName;
            });

            if (sourceType && targetType) {
                let sourceNodes = layoutNodes.filter((node) => getAtomType(ai, node.id).id === sourceType.id);
                let targetNodes = layoutNodes.filter((node) => getAtomType(ai, node.id).id === targetType.id);

                let sourceNodeIds = sourceNodes.map((node) => node.id);
                let targetNodeIds = targetNodes.map((node) => node.id);

                let directions = sigDirection.directions || [];

                // Now for each direction, and each source node, we need to ensure that the target node is in the right place.
                directions.forEach((direction) => {
                    sourceNodeIds.forEach((sourceNodeId) => {
                        targetNodeIds.forEach((targetNodeId) => {

                            if (direction == "left") {
                                constraints.push(this.leftConstraint(targetNodeId, sourceNodeId, this.minSepWidth, layoutNodes));
                            }
                            else if (direction == "above") {
                                constraints.push(this.topConstraint(targetNodeId, sourceNodeId, this.minSepHeight, layoutNodes));
                            }
                            else if (direction == "right") {
                                constraints.push(this.leftConstraint(sourceNodeId, targetNodeId, this.minSepWidth, layoutNodes));
                            }
                            else if (direction == "below") {
                                constraints.push(this.topConstraint(sourceNodeId, targetNodeId, this.minSepHeight, layoutNodes));
                            }
                            else if (direction == "directlyLeft") {
                                constraints.push(this.leftConstraint(targetNodeId, sourceNodeId, this.minSepWidth, layoutNodes));
                                constraints.push(this.ensureSameYConstraint(targetNodeId, sourceNodeId, layoutNodes));
                            }
                            else if (direction == "directlyAbove") {
                                constraints.push(this.topConstraint(targetNodeId, sourceNodeId, this.minSepHeight, layoutNodes));
                                constraints.push(this.ensureSameXConstraint(targetNodeId, sourceNodeId, layoutNodes));
                            }
                            else if (direction == "directlyRight") {
                                constraints.push(this.leftConstraint(sourceNodeId, targetNodeId, this.minSepWidth, layoutNodes));
                                constraints.push(this.ensureSameYConstraint(targetNodeId, sourceNodeId, layoutNodes));
                            }
                            else if (direction == "directlyBelow") {
                                constraints.push(this.topConstraint(sourceNodeId, targetNodeId, this.minSepHeight, layoutNodes));
                                constraints.push(this.ensureSameXConstraint(targetNodeId, sourceNodeId, layoutNodes));
                            }
                        });
                    });
                });
            }
        });
        return constraints;
    }


    private findDisconnectedComponents(edges): string[][] {
        let inNodes = edges.map(edge => edge.w);
        let outNodes = edges.map(edge => edge.v);

        // All nodes in the graph
        let allNodes = new Set([...inNodes, ...outNodes]);

        // List to store all connected components
        let components: string[][] = [];

        // Set to keep track of visited nodes
        let visited = new Set<string>();

        // Function to perform BFS and find all nodes in the same connected component
        const bfs = (startNode: string): string[] => {
            let queue: string[] = [startNode];
            let component: string[] = [];

            while (queue.length > 0) {
                let node = queue.shift();
                if (!visited.has(node)) {
                    visited.add(node);
                    component.push(node);

                    // Get all the outgoing and incoming edges from this node
                    let neighbors = edges
                        .filter(edge => edge.v === node || edge.w === node)
                        .map(edge => (edge.v === node ? edge.w : edge.v));

                    // Add unvisited neighbors to the queue
                    neighbors.forEach(neighbor => {
                        if (!visited.has(neighbor)) {
                            queue.push(neighbor);
                        }
                    });
                }
            }

            return component;
        };

        // Iterate over all nodes and find all connected components
        allNodes.forEach(node => {
            if (!visited.has(node)) {
                let component = bfs(node);
                components.push(component);
            }
        });

        return components;
    }



    private orderNodesByEdges(edges): string[][] {

        let inNodes = edges.map(edge => edge.w);
        let outNodes = edges.map(edge => edge.v);

        // Root nodes have no incoming edges
        let rootNodes = outNodes.filter(node => !inNodes.includes(node));

        let graphComponents = this.findDisconnectedComponents(edges);
        graphComponents.forEach((component) => {
            // Ensure a root node is present in each component
            let containsARoot = component.some(node => rootNodes.includes(node));

            if (!containsARoot) {
                rootNodes.push(component[0]);
            }

        });

        return rootNodes.map((rootNode) => {
            let visited = new Set<number>();
            let traversalOrder = [];
            let queue: number[] = [rootNode];

            while (queue.length > 0) {
                let node = queue.pop();
                if (!visited.has(node)) {
                    visited.add(node);
                    traversalOrder.push(node);

                    // Get all the outgoing edges from this node
                    let outgoingEdges = edges.filter(edge => edge.v === node);
                    let outgoingNodes = outgoingEdges.map(edge => edge.w);

                    // Add the outgoing nodes to the queue
                    queue = queue.concat(outgoingNodes);
                }
            }
            return traversalOrder;
        });
    }



    private leftConstraint(leftId: string, rightId: string, minDistance: number, layoutNodes: LayoutNode[]): LeftConstraint {

        let left = layoutNodes.find((node) => node.id === leftId);
        let right = layoutNodes.find((node) => node.id === rightId);

        return { left: left, right: right, minDistance: minDistance };
    }

    private topConstraint(topId: string, bottomId: string, minDistance: number, layoutNodes: LayoutNode[]): TopConstraint {

        let top = layoutNodes.find((node) => node.id === topId);
        let bottom = layoutNodes.find((node) => node.id === bottomId);

        return { top: top, bottom: bottom, minDistance: minDistance };
    }

    private ensureSameYConstraint(node1Id: string, node2Id: string, layoutNodes: LayoutNode[]): AlignmentConstraint {

        let node1 = layoutNodes.find((node) => node.id === node1Id);
        let node2 = layoutNodes.find((node) => node.id === node2Id);

        return { axis: "y", node1: node1, node2: node2 };
    }

    private ensureSameXConstraint(node1Id: string, node2Id: string, layoutNodes: LayoutNode[]): AlignmentConstraint {

        let node1 = layoutNodes.find((node) => node.id === node1Id);
        let node2 = layoutNodes.find((node) => node.id === node2Id);

        return { axis: "x", node1: node1, node2: node2 };
    }



    // TODO: We should also have a validate layout function that checks if the layout is satisfiable.

}