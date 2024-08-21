
import { group } from 'console';
import { Graph, Edge } from 'graphlib';
import { AlloyInstance, getAtomType, getInstanceTypes } from '../alloy-instance';
import { isBuiltin, AlloyType } from '../alloy-instance/src/type';
import { AlloyAtom } from '../alloy-instance/src/atom';
import { applyProjections } from '../alloy-instance/src/projection';

import { LayoutSpec, ClosureDefinition, ClusterRelation, parseLayoutSpec } from './layoutspec';
import { LayoutNode, LayoutEdge, LayoutConstraint, InstanceLayout, LeftConstraint, TopConstraint, AlignmentConstraint } from './interfaces';

import { generateGraph } from '../alloy-graph';
import { Layout } from 'webcola';


export class LayoutInstance {

    private readonly _layoutSpec: LayoutSpec;
    readonly DEFAULT_GROUP_ON: string = "range";

    private readonly _sigColors: Record<string, string>;


    public readonly minSepHeight = 15;
    public readonly minSepWidth = 15;


    constructor(layoutSpecAsString: string) {
        this._layoutSpec = parseLayoutSpec(layoutSpecAsString);

        this._sigColors = {};
        if (this._layoutSpec.sigColors) {
            this._layoutSpec.sigColors.forEach((sigColor) => {
                this._sigColors[sigColor.sigName] = sigColor.color;
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
    private generateGroups(g: Graph): Record<string, string[]> {

        let groups: Record<string, string[]> = {};
        // Should we also remove the groups from the graph?

        let graphEdges = [...g.edges()];

        // Go through all edge labels in the graph
        graphEdges.forEach((edge) => {
            const edgeId = edge.name;
            const relName = this.getRelationName(g, edge);


            // clusterSettings is defined only if the field should be used to group atoms
            const clusterSettings = this.getClusterSettings(relName);

            if (clusterSettings) {

                // If so, add the targter as a group key,
                // and the source as a value in the group

                // Check if clusterSettings has a groupOn field
                const groupOn = clusterSettings.groupOn || this.DEFAULT_GROUP_ON;



                let { source, target } = this.getGroupSourceAndTarget(edge, groupOn);
                let groupName = target + ":" + this.getEdgeLabel(g, edge);

                if (groups[groupName]) {
                    groups[groupName].push(source);
                }
                else {
                    groups[groupName] = [source];
                }

                // But also remove this edge from the graph.
                g.removeEdge(edge.v, edge.w, edgeId);

                // TODO: We may lose some good layout information here though.
                // Could we somehow associate the group with the source (make them be close?)

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


    private getRandomColor(): string {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    private colorNodesByType(g: Graph, a: AlloyInstance): Record<string, string> {
        let colorsByType: Record<string, string> = {};
        let nodes = [...g.nodes()];

        let types = getInstanceTypes(a);

        // For each type, assign a unique, random color
        types.forEach((type) => {

            // If the type has a color specified, use that
            if (this._sigColors[type.id]) {
                colorsByType[type.id] = this._sigColors[type.id];
            }
            else {
                colorsByType[type.id] = this.getRandomColor();
            }
        });


        let colorsByNode = {};
        nodes.forEach((node) => {
            // Get the type of the node
            let type = getAtomType(a, node);
            let color = colorsByType[type.id];
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




    private applyLayoutProjections(ai: AlloyInstance): AlloyInstance {

        let projectedSigs: string[] = this.projectedSigs;
        let projectedTypes: AlloyType[] = projectedSigs.map((sig) => ai.types[sig]);
        // Then get the the atoms of the projected types
        let projectedAtoms: AlloyAtom[] = projectedTypes.flatMap((type) => type.atoms);
        let projectedAtomIds: string[] = projectedAtoms.map((atom) => atom.id);

        // Get new instance, calling applyProjectioons
        let projectedInstance = applyProjections(ai, projectedAtomIds);
        return projectedInstance;
    }



    public generateLayout(a: AlloyInstance): InstanceLayout {
        let ai = this.applyLayoutProjections(a);
        let g: Graph = generateGraph(ai, this.hideDisconnected, this.hideDisconnectedBuiltIns);


        const attributes = this.generateAttributes(g);
        const groups = this.generateGroups(g);
        const colors = this.colorNodesByType(g, a);


        // Let's hydrate the nodes
        let layoutNodes: LayoutNode[] = g.nodes().map((nodeId) => {

            let color = colors[nodeId];
            let nodeGroups = Object.keys(groups).filter((group) => groups[group].includes(nodeId));
            let nodeAttributes = attributes[nodeId] || {};
            return { id: nodeId, color: color, groups: nodeGroups, attributes: nodeAttributes };
        });


        // Now we apply the closure constraints
        let constraints = this.applyClosureConstraints(g, layoutNodes);


        // Now edges and relational constraints
        let layoutEdges: LayoutEdge[] = g.edges().map((edge) => {
            const edgeId = edge.name;
            const edgeLabel : string = g.edge(edge.v, edge.w, edgeId);

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

            let e : LayoutEdge = { 
                source: source,
                 target: target,
                 label: edgeLabel,
                 relationName: relName,
                 id: edgeId};
            return e;
        });
        return { nodes: layoutNodes, edges: layoutEdges, constraints: constraints };
    }


    applyClosureConstraints(g: Graph, layoutNodes: LayoutNode[]): LayoutConstraint[] {

        const closures = this.getClosures();

        let constraints = closures.map((closure) => {
            return this.applyClosureConstraint(g, layoutNodes, closure.fieldName, closure.direction);
        });

        return constraints.flat();

    }

    applyClosureConstraint(g: Graph, layoutNodes: LayoutNode[], relName: string, direction: string): LayoutConstraint[] {
        let direction_mult: number = 0;
        if (direction === "clockwise") {
            direction_mult = 1;
        }
        else if (direction === "counterclockwise") {
            direction_mult = -1;
        }

        let relationEdges = g.edges().filter(edge => {
            return this.getRelationName(g, edge) === relName;
        });

        if (relationEdges.length === 0) { return []; }

        let relatedNodeFragments = this.orderNodesByEdges(relationEdges);
        var fragment_num = 0;

        let constraints: LayoutConstraint[] = [];
        relatedNodeFragments.forEach((relatedNodes) => {

            const fragmentCentroid: LayoutNode = {
                id: `_${relName}_${fragment_num++}`,
                attributes: {},
                groups: [],
                color: "transparent"
            };
            layoutNodes.push(fragmentCentroid);


            // Now keep the related nodes a fixed distance from the centroid
            const fixedDistance = 30; // Example fixed distance
            const angleStep = (direction_mult * 2 * Math.PI) / relatedNodes.length;
            let index = 0;

            relatedNodes.forEach(nodeId => {

                const angle = index * angleStep;
                const x_gap = fixedDistance * Math.cos(angle);
                const y_gap = fixedDistance * Math.sin(angle);

                if (x_gap > 0) {
                    constraints.push(this.leftConstraint(fragmentCentroid.id, nodeId, x_gap, layoutNodes));
                }
                else {
                    constraints.push(this.leftConstraint(nodeId, fragmentCentroid.id, -x_gap, layoutNodes));
                }

                if (y_gap > 0) {
                    constraints.push(this.topConstraint(fragmentCentroid.id, nodeId, y_gap, layoutNodes));
                }
                else {
                    constraints.push(this.topConstraint(nodeId, fragmentCentroid.id, -y_gap, layoutNodes));
                }
                index++;
            });

        });

        return constraints;
    }



    private orderNodesByEdges(edges): string[][] {

        let inNodes = edges.map(edge => edge.w);
        let outNodes = edges.map(edge => edge.v);

        // Root nodes have no incoming edges
        let rootNodes = outNodes.filter(node => !inNodes.includes(node));

        if (rootNodes.length === 0) {
            // If there are no root nodes, just pick any node
            rootNodes = [outNodes[0]];
        }


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
                    let outgoingNodes = edges.map(edge => edge.w);

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