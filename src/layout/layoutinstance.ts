import { Graph, Edge } from 'graphlib';
import { AlloyInstance, getAtomType, getInstanceTypes } from '../alloy-instance';
import { isBuiltin, AlloyType } from '../alloy-instance/src/type';
import { applyProjections } from '../alloy-instance/src/projection';




import {
    LayoutNode, LayoutEdge, LayoutConstraint, InstanceLayout,
    LeftConstraint, TopConstraint, AlignmentConstraint, LayoutGroup
} from './interfaces';

import {
    LayoutSpec, parseLayoutSpec,
    RelativeOrientationConstraint, CyclicOrientationConstraint,
    GroupByField, GroupBySelector
} from './layoutspec';





import { generateGraph } from '../alloy-graph';
import { WrappedForgeEvaluator } from '../forge-util/evaluatorUtil';
import { ColorPicker } from './colorpicker';
import { ConstraintValidator } from './constraint-validator';
import { SingleValue } from 'forge-expr-evaluator/dist/ForgeExprEvaluator';

const UNIVERSAL_TYPE = "univ";




interface LayoutNodePath {
    Path: LayoutNode[]
    LoopsTo: LayoutNode | undefined
};



export class LayoutInstance {


    readonly hideThisEdge = "_h_"
    static DISCONNECTED_PREFIX = "_d_"
    readonly DEFAULT_NODE_ICON_PATH: string = null;
    readonly DEFAULT_NODE_HEIGHT = 60;
    readonly DEFAULT_NODE_WIDTH = 100;

    private readonly _layoutSpec: LayoutSpec;
    readonly DEFAULT_GROUP_ON: string = "range";

    public readonly minSepHeight = 15;
    public readonly minSepWidth = 15;

    private evaluator: WrappedForgeEvaluator;
    private instanceNum: number;


    constructor(layoutSpec: LayoutSpec, evaluator: WrappedForgeEvaluator, instNum: number = 0) {
        this.instanceNum = instNum;
        this.evaluator = evaluator;
        this._layoutSpec = layoutSpec;
    }


    get projectedSigs(): string[] {
        if (!this._layoutSpec.directives.projections) {
            return [];
        }
        return this._layoutSpec.directives.projections.map((projection) => projection.sig);
    }

    get hideDisconnected(): boolean {
        return this._layoutSpec.directives.hideDisconnected || false;
    }

    get hideDisconnectedBuiltIns(): boolean {
        return this._layoutSpec.directives.hideDisconnectedBuiltIns || false;
    }



    isAttributeField(fieldId: string): boolean {
        const isAttributeRel = this._layoutSpec.directives.attributes.find((ad) => ad.field === fieldId);
        return isAttributeRel ? true : false;
    }



    /**
     * Generates groups based on the specified graph.
     * @param g - The graph, which will be modified to remove the edges that are used to generate groups.
     * @param a - The ORIGINAL (pre-projection) Alloy instance.
     * @returns A record of groups.
     */
    private generateGroups(g: Graph, a : AlloyInstance): LayoutGroup[] {

        //let groupingConstraints : GroupingConstraint[] = this._layoutSpec.constraints.grouping;


        let groupByFieldConstraints: GroupByField[] = this._layoutSpec.constraints.grouping.byfield;
        let groupBySelectorConstraints: GroupBySelector[] = this._layoutSpec.constraints.grouping.byselector;


        if (!groupByFieldConstraints && !groupBySelectorConstraints) {
            return [];
        }

        let groups: LayoutGroup[] = [];
        // Should we also remove the groups from the graph?


        // First we go through the group by selector constraints.


        for (var gc of groupBySelectorConstraints) {

            let selector = gc.selector;
            let selectorRes = this.evaluator.evaluate(selector, this.instanceNum);
            let selectedElements: string[] = selectorRes.selectedAtoms();

            // Nothing to do if there are no selected elements, or 
            // if things are typed weirdly.
            if (selectedElements.length === 0) {
                continue;
            }

            let keyNode = selectedElements[0]; // TODO: WAIT, THERE IS NO KEY NODE

            // Question: Does **just** having LayoutGroup work? Like what does a keyNode even mean?
            let newGroup: LayoutGroup = {
                name: gc.name,
                nodeIds: selectedElements,
                keyNodeId: keyNode,
                showLabel: true
            };
            groups.push(newGroup);
        }


        // Now we go through the group by field constraints.

        let graphEdges = [...g.edges()];


        function getConstraintsRelatedToField(fieldName: string) {
            let fieldConstraints = groupByFieldConstraints.filter((d) => {
                let match = d.field === fieldName
                return match;
            });
            return fieldConstraints;
        }

      



        graphEdges.forEach((edge) => {
            const edgeId = edge.name;
            const relName = this.getRelationName(g, edge);


            let relatedConstraints = getConstraintsRelatedToField(relName);

            if (relatedConstraints.length === 0) {
                return;
            }

            let edgeLabel = this.getEdgeLabel(g, edge);


            relatedConstraints.forEach((c) => {

                const groupOn = c.groupOn; // This is the part of the relation tuple that is the key.
                const addToGroup = c.addToGroup; // This is the part of the relation tuple that is IN the group.


                const potentialTuples = this.getFieldTuplesForSourceAndTarget(a, relName, edge.v, edge.w);
                if(!potentialTuples || potentialTuples.length === 0) {
                    return;
                }
                
  
                for (var thisTuple of potentialTuples) {
                    let arity = thisTuple?.length || 0;
                    if (arity < 2 || (groupOn < 0 || groupOn >= arity) || (addToGroup < 0 || addToGroup >= arity)) {
                        throw new Error(`Invalid grouping. groupOn=${groupOn} and addToGroup=${addToGroup} for ${arity}-ary relation ${relName}. These must be between 0 and ${arity - 1}.`);
                    }
                    // Now get the element of edge
                
                
                    let sourceInGraph = thisTuple[0];
                    let targetInGraph = thisTuple[arity - 1];

                    let key = thisTuple[groupOn];
                    let toAdd = thisTuple[addToGroup];

                    // AND KEY is what you REALLY group on.
                    // BUT NOW I"m CONFUSED. WHERE IS KEY? IS IT JUST IN THE GROUP NAME IDENTIFIER?

                    let labelString = thisTuple.map((s, idx) => {
                        if (idx === groupOn) {
                            return s;
                        }
                        else return "_";
                    }).join(",");

                    //let groupName = key + ":" + edgeLabel;
                    let groupName = `${relName}[${labelString}]`; // TODO: THis?

                    


                    // Check if the group already exists
                    let existingGroup: LayoutGroup = groups.find((group) => group.name === groupName);

                    if (existingGroup) {
                        existingGroup.nodeIds.push(toAdd);
                        // But also remove this edge from the graph.
                        g.removeEdge(edge.v, edge.w, edgeId);
                        // Remove the edge and then add it again.
                        /// This is specifically so that other orientation properties hold.
                        /// Ideally, this HACK would be removed.


                       // const newId = this.hideThisEdge + edgeId;
                        g.removeEdge(edge.v, edge.w, edgeId);
                        //g.setEdge(edge.v, edge.w, edgeLabel, newId);
                    }
                    else {

                        let newGroup: LayoutGroup =
                        {
                            name: groupName,
                            nodeIds: [toAdd],
                            keyNodeId: sourceInGraph, //key, // This needs to not be the KEY but the source in the graph.
                            showLabel: true // For now
                        };
                        groups.push(newGroup);
                        // HACK: Don't remove the FIRST edge connecting node to group, we can respect SOME spatiality?
                        const groupEdgePrefix = "_g_"
                        const newId = groupEdgePrefix + edgeId;
                        g.removeEdge(edge.v, edge.w, edgeId);
                        g.setEdge(edge.v, edge.w, groupName, newId);
                    }
                }
            });
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


    private getMostSpecificType(node: string, a: AlloyInstance): string {
        let type = getAtomType(a, node);
        let allTypes = type.types;
        let mostSpecificType = allTypes[0];
        return mostSpecificType;
    }

    private getNodeTypes(node: string, a: AlloyInstance): string[] {
        let type = getAtomType(a, node);
        let allTypes = type.types.concat(UNIVERSAL_TYPE);
        return allTypes;
    }




    public getRelationName(g: Graph, edge: Edge): string {
        let relNameRaw = this.getEdgeLabel(g, edge);
        let relName = relNameRaw.split("[")[0];
        return relName;
    }

    private getEdgeLabel(g: Graph, edge: Edge): string {
        return g.edge(edge.v, edge.w, edge.name);
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


        let nodeIconMap = this.getNodeIconMap(g);
        let nodeColorMap = this.getNodeColorMap(g, ai);
        let nodeSizeMap = this.getNodeSizeMap(g);


        /// Groups have to happen here ///
        let groups = this.generateGroups(g, a);
        this.ensureNoExtraNodes(g, a);
        let dcN = this.getDisconnectedNodes(g);

        let layoutNodes: LayoutNode[] = g.nodes().map((nodeId) => {

            let color = nodeColorMap[nodeId] || "black";
            let iconPath = nodeIconMap[nodeId] || this.DEFAULT_NODE_ICON_PATH;
            let { height, width } = nodeSizeMap[nodeId] || { height: this.DEFAULT_NODE_HEIGHT, width: this.DEFAULT_NODE_WIDTH };
            
            const mostSpecificType = this.getMostSpecificType(nodeId, a);
            const allTypes = this.getNodeTypes(nodeId, a);

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
                height: height,
                width: width,
                mostSpecificType: mostSpecificType,
                types: allTypes
            };
        });

        ///////////// CONSTRAINTS ////////////
        let constraints: LayoutConstraint[] = this.applyRelatativeOrientationConstraints(layoutNodes);


        let layoutEdges: LayoutEdge[] = g.edges().map((edge) => {
            const edgeId = edge.name;
            const edgeLabel: string = g.edge(edge.v, edge.w, edgeId);
            let source = layoutNodes.find((node) => node.id === edge.v);
            let target = layoutNodes.find((node) => node.id === edge.w);
            let relName = this.getRelationName(g, edge);

            let relTuples = this.getFieldTuplesForSourceAndTarget(a, relName, edge.v, edge.w);
            // But what if there are multiple tuples?


            let e: LayoutEdge = {
                source: source,
                target: target,
                label: edgeLabel,
                relationName: relName,
                id: edgeId
            };
            return e;
        });

        //////////////////////// HACK /////////////
        /*
            Here, we implement a hacky approach that tries MULTIPLE 
            perturbations of the cyclic constraints to find a satisfying layout.

            This is because we're using a linear constraint solver and so don't have disjunctions.
            TODO: Replacing this with something like MiniZinc would
            make this much easier, since the solver could support disjunctions.

        */

        // First, ensure that the layout is satisfiable BEFORE cyclic constraints.
        let layoutWithoutCyclicConstraints: InstanceLayout = { nodes: layoutNodes, edges: layoutEdges, constraints: constraints, groups: groups };
        const validatorWithoutCyclic = new ConstraintValidator(layoutWithoutCyclicConstraints);
        const nonCyclicConstraintError = validatorWithoutCyclic.validateConstraints();

        if (nonCyclicConstraintError) {
            throw new Error(nonCyclicConstraintError);
        }
        // And updating constraints, since the validator may add constraints.
        // (IN particular these would be non-overlap constraints for spacing in groups.)
        // TODO: However, this introduces
        // ANOTHER POTENTIAL BUG, I THINK. WHAT IF CIRCULAR PERTURBATIONS CHANGE 
        // DIRECTLY RIGHT/LEFT?
        constraints = layoutWithoutCyclicConstraints.constraints;



        // This function applies permutations of the cyclic constraints
        // until it finds a satisfying layout, or it runs out of permutations.
        let closureConstraints = this.applyCyclicConstraints(layoutNodes, layoutWithoutCyclicConstraints);
        // Append the closure constraints to the constraints
        constraints = constraints.concat(closureConstraints);

        /////// END HACK //////////




        // Filter out all edges that are hidden
        layoutEdges = layoutEdges.filter((edge) => !edge.id.startsWith(this.hideThisEdge));

        // And now make sure that all the disconnected nodes (as identified)
        // have some padding around them.
        let dcnGroups = dcN.map((node) => {
            return this.singletonGroup(node);
        }
        );
        groups = groups.concat(dcnGroups);


        let layout = { nodes: layoutNodes, edges: layoutEdges, constraints: constraints, groups: groups };

        let finalConstraintValidator = new ConstraintValidator(layout);
        let finalLayoutError = finalConstraintValidator.validateConstraints();
        if (finalLayoutError) {
            throw new Error(finalLayoutError);
        }

        return { layout, projectionData };
    }

    /**
     * Applies the cyclic orientation constraints to the layout nodes.
     * @param layoutNodes - The layout nodes to which the constraints will be applied.
     * @returns An array of layout constraints.
     */
    applyCyclicConstraints(layoutNodes: LayoutNode[], layoutWithoutCyclicConstraints: InstanceLayout): LayoutConstraint[] {

        const cyclicConstraints = this._layoutSpec.constraints.orientation.cyclic;

        let constraints = cyclicConstraints.map((c) => {
            return this.applyCyclicConstraint(c, layoutNodes, layoutWithoutCyclicConstraints);
        });
        return constraints.flat();
    }

    applyCyclicConstraint(c: CyclicOrientationConstraint, layoutNodes: LayoutNode[], layoutWithoutCyclicConstraints: InstanceLayout): LayoutConstraint[] {

        let direction = c.direction;
        let direction_mult: number = 0;
        if (direction === "clockwise") {
            direction_mult = 1;
        }
        else if (direction === "counterclockwise") {
            direction_mult = -1;
        }

        let selectedTuples: string[][] = this.evaluator.evaluate(c.selector, this.instanceNum).selectedTwoples();
        let nextNodeMap: Map<LayoutNode, LayoutNode[]> = new Map<LayoutNode, LayoutNode[]>();


        // For each tuple, add to the nextNodeMap
        selectedTuples.forEach((tuple) => {
            let sourceNodeId = tuple[0];
            let targetNodeId = tuple[1];

            let srcN = layoutNodes.find((node) => node.id === sourceNodeId);
            let tgtN = layoutNodes.find((node) => node.id === targetNodeId);

            if (nextNodeMap.has(srcN)) {
                nextNodeMap.get(srcN).push(tgtN);
            }
            else {
                nextNodeMap.set(srcN, [tgtN]);
            }
        });

        let relatedNodeFragments = this.getFragmentsToConstrain(nextNodeMap);

        // Here, we want to validate constraints EACH time a
        // fragment is added, trying at least a few angle steps each time.

        let constraints: LayoutConstraint[] = [];
        relatedNodeFragments.forEach((relatedNodesPath) => {
            const minRadius = 100; // Example fixed distance. 
            let relatedNodes = relatedNodesPath.Path.map((node) => node.id);

            // TODO: One thing we dont have here is PREVENTING FRAGMENTS FROM OVERLAPPING

            const angleStep = (direction_mult * 2 * Math.PI) / relatedNodes.length;

            // So first lay out all nodes in the fragment
            let fragmentNodePositions = {};

            let offset = 0;
            let satisfyingAssignmentFound = false;

            let finalFragmentConstraints: LayoutConstraint[] = [];
            let currentLayoutError = null;
            while (!satisfyingAssignmentFound && offset < relatedNodes.length) {
                currentLayoutError = null;
                let fragmentConstraintsForCurrentOffset: LayoutConstraint[] = [];

                for (var i = 0; i < relatedNodes.length; i++) {
                    let theta = (i + offset) * angleStep;
                    let x = minRadius * Math.cos(theta);
                    let y = minRadius * Math.sin(theta);
                    fragmentNodePositions[relatedNodes[i]] = { x: x, y: y };
                }

                // Now we determine the constraints

                for (var i = 0; i < relatedNodes.length; i++) {

                    for (var j = 0; j < relatedNodes.length; j++) {
                        if (i !== j) {
                            let node1 = relatedNodes[i];
                            let node2 = relatedNodes[j];
                            let node1_pos = fragmentNodePositions[node1];
                            let node2_pos = fragmentNodePositions[node2];

                            if (node1_pos.x > node2_pos.x) {
                                fragmentConstraintsForCurrentOffset.push(this.leftConstraint(node2, node1, this.minSepWidth, layoutNodes));
                            }
                            else if (node1_pos.x < node2_pos.x) {
                                fragmentConstraintsForCurrentOffset.push(this.leftConstraint(node1, node2, this.minSepWidth, layoutNodes));
                            }
                            else {
                                // If they are on the same x-axis, we need to ensure that they are not on top of each other
                                fragmentConstraintsForCurrentOffset.push(this.ensureSameXConstraint(node1, node2, layoutNodes));
                            }

                            if (node1_pos.y > node2_pos.y) {
                                fragmentConstraintsForCurrentOffset.push(this.topConstraint(node2, node1, this.minSepHeight, layoutNodes));
                            }
                            else if (node1_pos.y < node2_pos.y) {
                                fragmentConstraintsForCurrentOffset.push(this.topConstraint(node1, node2, this.minSepHeight, layoutNodes));
                            }
                            else {
                                // If they are on the same y-axis, we need to ensure that they are not on top of each other
                                fragmentConstraintsForCurrentOffset.push(this.ensureSameYConstraint(node1, node2, layoutNodes));
                            }
                        }
                    }
                }

                finalFragmentConstraints = fragmentConstraintsForCurrentOffset;

                let allConstraintsForFragment: LayoutConstraint[] = fragmentConstraintsForCurrentOffset.concat(layoutWithoutCyclicConstraints.constraints);

                let instanceLayout: InstanceLayout = {
                    nodes: layoutWithoutCyclicConstraints.nodes,
                    constraints: allConstraintsForFragment,
                    edges: layoutWithoutCyclicConstraints.edges,
                    groups: layoutWithoutCyclicConstraints.groups
                };
                let validator = new ConstraintValidator(instanceLayout);
                currentLayoutError = validator.validateConstraints();
                // If we don't find anything, its done.
                satisfyingAssignmentFound = currentLayoutError == null || currentLayoutError === "";
                offset++;
            }

            if (!satisfyingAssignmentFound) {
                throw new Error(currentLayoutError);
            }
            else {
                constraints = constraints.concat(finalFragmentConstraints);
            }
        });

        return constraints;
    }


    private getAllPaths(nextNodeMap: Map<LayoutNode, LayoutNode[]>): LayoutNodePath[] {

        const allPaths: LayoutNodePath[] = [];

        const visited = new Set<LayoutNode>(); // To track visited nodes in the current path

        function dfs(currentNode: LayoutNode, path: LayoutNode[]): void {
            // Add the current node to the path
            path.push(currentNode);

            // If the current node has no outgoing edges, add the path to allPaths
            if (!nextNodeMap.has(currentNode) || nextNodeMap.get(currentNode).length === 0) {
                allPaths.push({ Path: [...path], LoopsTo: undefined });
            } else {
                // Recursively visit all neighbors
                for (const neighbor of nextNodeMap.get(currentNode)) {
                    if (!path.includes(neighbor)) {
                        // Continue DFS if the neighbor is not already in the path
                        dfs(neighbor, [...path]); // Pass a copy of the path to avoid mutation
                    } else {
                        // If the neighbor is already in the path, it's a cycle
                        allPaths.push({ Path: [...path], LoopsTo: neighbor });
                    }
                }
            }
        }

        // Start DFS from each node in the map
        for (const startNode of nextNodeMap.keys()) {
            if (!visited.has(startNode)) { // Since we have already documented the paths from this node.
                dfs(startNode, []);
            }
        }

        return allPaths;
    }

    // TODO: This doesn't deal with rotations :(
    private getFragmentsToConstrain(nextNodeMap: Map<LayoutNode, LayoutNode[]>): LayoutNodePath[] {
        const allPaths: LayoutNodePath[] = this.getAllPaths(nextNodeMap);


        function expandPath(p: LayoutNodePath, repeat: number): string[] {
            const ids = p.Path.map(n => n.id);

            if (!p.LoopsTo) return ids;

            const loopStart = ids.findIndex(id => id === p.LoopsTo!.id);
            if (loopStart === -1) {
                return ids; // fallback to base path
            }

            const prefix = ids.slice(0, loopStart);
            const loop = ids.slice(loopStart);

            return prefix.concat(...Array(repeat).fill(loop));
        }

        function isSubpath(longer: LayoutNodePath, shorter: LayoutNodePath): boolean {

            let longerUnrolled = expandPath(longer, 2);
            let shorterUnrolled = expandPath(shorter, 1);

            // If shorterUnrolled is longer than longerUnrolled, it cannot be a sub-array
            if (shorterUnrolled.length > longerUnrolled.length) {
                return false;
            }

            // Sliding window approach
            for (let i = 0; i <= longerUnrolled.length - shorterUnrolled.length; i++) {
                // Check if the sub-array starting at index `i` matches shorterUnrolled
                if (shorterUnrolled.every((value, j) => value === longerUnrolled[i + j])) {
                    return true;
                }
            }

            return false;
        }


        function equivalentPaths(p1: LayoutNodePath, p2: LayoutNodePath): boolean {
            return isSubpath(p1, p2) && isSubpath(p2, p1);
        }


        // First dedup allPaths
        let nonEquivalentPaths: LayoutNodePath[] = allPaths.filter((p, i) => {
            // Check if there is any earlier path in the array that is equivalent to the current path
            return !allPaths.some((p2, j) => j < i && equivalentPaths(p, p2));
        });

        let nonSubsumedPaths: LayoutNodePath[] = nonEquivalentPaths.filter((p, i) => {
            let isSubsumed = nonEquivalentPaths.some((p2, j) => {
                
                return i !== j && isSubpath(p2, p);
            });
            return !isSubsumed;
        });
        return nonSubsumedPaths;
    }


    /**
     * Applies the relative orientation constraints to the layout nodes.
     * @param layoutNodes - The layout nodes to which the constraints will be applied.
     * @returns An array of layout constraints.
     */
    applyRelatativeOrientationConstraints(layoutNodes: LayoutNode[]): LayoutConstraint[] {

        let constraints: LayoutConstraint[] = [];
        let relativeOrientationConstraints = this._layoutSpec.constraints.orientation.relative;

        relativeOrientationConstraints.forEach((c: RelativeOrientationConstraint) => {

            let directions = c.directions;
            let selector = c.selector;

            let selectorRes = this.evaluator.evaluate(selector, this.instanceNum);
            let selectedTuples: string[][] = selectorRes.selectedTwoples();

            // For each tuple, we need to apply the constraints
            selectedTuples.forEach((tuple) => {
                let sourceNodeId = tuple[0];
                let targetNodeId = tuple[1];

                directions.forEach((direction) => {
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

        return constraints;
    }




    private getDisconnectedNodes(g: Graph): string[] {
            let inNodes = g.edges().map(edge => edge.w);
            let outNodes = g.edges().map(edge => edge.v);

            // All nodes in the graph
            let allNodes = new Set(g.nodes());
            let allConnectedNodes = new Set([...inNodes, ...outNodes]);
            let disconnectedNodes =[...allNodes].filter(node => !allConnectedNodes.has(node));
            return disconnectedNodes;
        }



    private getNodeFromId(nodeId: string, layoutNodes: LayoutNode[]): LayoutNode {
            let node = layoutNodes.find((node) => node.id === nodeId);
            if (!node) {
                throw new Error(`Node ${nodeId} not found in graph. Did you hide it? If this is a built-in type, try removing any visibility flags.`);
            }
            return node;
    }


    private leftConstraint(leftId: string, rightId: string, minDistance: number, layoutNodes: LayoutNode[]): LeftConstraint {

            let left = this.getNodeFromId(leftId, layoutNodes);
            let right = this.getNodeFromId(rightId, layoutNodes);
            return { left: left, right: right, minDistance: minDistance };
        }

    private topConstraint(topId: string, bottomId: string, minDistance: number, layoutNodes: LayoutNode[]): TopConstraint {

            let top = this.getNodeFromId(topId, layoutNodes);
            let bottom = this.getNodeFromId(bottomId, layoutNodes);

            return { top: top, bottom: bottom, minDistance: minDistance };
        }

    private ensureSameYConstraint(node1Id: string, node2Id: string, layoutNodes: LayoutNode[]): AlignmentConstraint {

            let node1 = this.getNodeFromId(node1Id, layoutNodes);
            let node2 = this.getNodeFromId(node2Id, layoutNodes);

            return { axis: "y", node1: node1, node2: node2 };
        }

    private ensureSameXConstraint(node1Id: string, node2Id: string, layoutNodes: LayoutNode[]): AlignmentConstraint {

        let node1 = this.getNodeFromId(node1Id, layoutNodes);
        let node2 = this.getNodeFromId(node2Id, layoutNodes);

            return { axis: "x", node1: node1, node2: node2 };
        }

    private singletonGroup(nodeId: string): LayoutGroup {

            let groupName = `${LayoutInstance.DISCONNECTED_PREFIX}${nodeId}`;

            return {
                name: groupName,
                nodeIds: [nodeId],
                keyNodeId: nodeId,
                showLabel: false
            }
        }



    private getNodeSizeMap(g: Graph): Record<string, { width: number; height: number }> {
        let nodeSizeMap: Record<string, { width: number; height: number }> = {};
        const DEFAULT_SIZE = { width: this.DEFAULT_NODE_WIDTH, height: this.DEFAULT_NODE_HEIGHT };
    
        // Apply size directives first
        let sizeDirectives = this._layoutSpec.directives.sizes;
        sizeDirectives.forEach((sizeDirective) => {
            let selectedNodes = this.evaluator.evaluate(sizeDirective.selector, this.instanceNum).selectedAtoms();
            let width = sizeDirective.width;
            let height = sizeDirective.height;
    
            selectedNodes.forEach((nodeId) => {

                if (nodeSizeMap[nodeId]) {

                    let oldSizeStr = JSON.stringify(nodeSizeMap[nodeId]);
                    let newSizeStr = JSON.stringify({ width: width, height: height });


                    throw new Error(`Size Conflict: "${nodeId}" cannot have multiple sizes: ${oldSizeStr}, ${newSizeStr}.`);
                }

                nodeSizeMap[nodeId] = { width: width, height: height };
            });
        });
    
        // Set default sizes for nodes that do not have a size set
        let graphNodes = [...g.nodes()];
        graphNodes.forEach((nodeId) => {
            if (!nodeSizeMap[nodeId]) {
                nodeSizeMap[nodeId] = DEFAULT_SIZE;
            }
        });
    
        return nodeSizeMap;
    }


    private getNodeColorMap(g: Graph, a: AlloyInstance): Record<string, string> {
        let nodeColorMap: Record<string, string> = {};
    
        // Start by getting the default signature colors
        let sigColors = this.getSigColors(a);
    
        // Apply color directives first
        let colorDirectives = this._layoutSpec.directives.colors;
        colorDirectives.forEach((colorDirective) => {
            let selected = this.evaluator.evaluate(colorDirective.selector, this.instanceNum).selectedAtoms();
            let color = colorDirective.color;
    
            selected.forEach((nodeId) => {
                if (nodeColorMap[nodeId]) {
                    throw new Error(`Color Conflict: "${nodeId}" cannot have multiple colors:  ${nodeColorMap[nodeId]}, ${color}.`);
                }
                nodeColorMap[nodeId] = color;
            });
        });
    
        // Set default colors for nodes that do not have a color set
        let graphNodes = [...g.nodes()];
        graphNodes.forEach((nodeId) => {
            if (!nodeColorMap[nodeId]) {
                let mostSpecificType = this.getMostSpecificType(nodeId, a);
                nodeColorMap[nodeId] = sigColors[mostSpecificType];
            }
        });
    
        return nodeColorMap;
    }

    private getNodeIconMap(g: Graph): Record<string, string> {
        let nodeIconMap: Record<string, string> = {};
        const DEFAULT_ICON = this.DEFAULT_NODE_ICON_PATH;

        // Apply icon directives first
        let iconDirectives = this._layoutSpec.directives.icons;
        iconDirectives.forEach((iconDirective) => {
            let selected = this.evaluator.evaluate(iconDirective.selector, this.instanceNum).selectedAtoms();
            let iconPath = iconDirective.path;

            selected.forEach((nodeId) => {
                if (nodeIconMap[nodeId]) {
                    throw new Error(`Icon Conflict: "${nodeId}" cannot have multiple icons:  ${nodeIconMap[nodeId]}, ${iconPath}.`);
                }
                nodeIconMap[nodeId] = iconPath;
            });
        });

        // Set default icons for nodes that do not have an icon set
        let graphNodes = [...g.nodes()];
        graphNodes.forEach((nodeId) => {
            if (!nodeIconMap[nodeId]) {
                nodeIconMap[nodeId] = DEFAULT_ICON;
            }
        });

        return nodeIconMap;
    }


    private getSigColors(ai : AlloyInstance) : Record < string, string > {
            let sigColors = {};

            let types = getInstanceTypes(ai);
            let colorPicker = new ColorPicker(types.length);
            types.forEach((type) => {
                sigColors[type.id] = colorPicker.getNextColor();
            });
            return sigColors;
        }

    private getFieldTuples(a : AlloyInstance, fieldName: string): string[][] {


        let field = Object.values(a.relations).find((rel) => rel.name === fieldName);


        if (!field) {
            return [];
        }

        let fieldTuples = field.tuples.map((tuple) => {
            return tuple.atoms;
        });
        return fieldTuples;
    }

    private getFieldTuplesForSourceAndTarget(a : AlloyInstance, fieldName: string, src : string, tgt : string): string[][] {

        let fieldTuples = this.getFieldTuples(a, fieldName);
        let filteredTuples = fieldTuples.filter((tuple) => {
            let arity = tuple.length;
            if (arity < 1) {
                return false;
            }
            return tuple[0] === src && tuple[arity-1] === tgt;
        });

        return filteredTuples;

    }
}