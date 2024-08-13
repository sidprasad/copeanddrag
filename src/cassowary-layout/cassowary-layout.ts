import { Graph } from 'graphlib';
import { LayoutInstance } from '../layoutinstance';
//import {Solver , Variable, Expression, Constraint, Strength, Operator} from '@lume/kiwi'
import { AlloyInstance } from '../alloy-instance';
import {SimplexSolver, Variable, Expression, Strength, Inequality, LEQ, GEQ, LE} from 'cassowary';



type GraphNode = {
    x: number;
    y: number;
    id: string;
    attributes: Record<string, string[]>;
    color: string;
    width: number;
    height: number;
};

type GraphEdge = {
    source: string;
    target: string;
    relName: string;
    label: string;
};

type BoundingBox = {
    topleft_x: number;
    topleft_y: number;
    width: number;
    height: number;
    id : string;
};

type BoundingBoxVars = { leftEdge: Variable, rightEdge: Variable, topEdge: Variable, bottomEdge: Variable };


class CassowaryLayout {


    private readonly minNodeSeparation = new Expression(20);
    private graph: Graph;
    private layoutInstance: LayoutInstance;
    private solver: SimplexSolver;

    private readonly PADDING = 10;

    private readonly nodes: GraphNode[];
    private readonly edges: GraphEdge[];

    private readonly groups: Record<string, string[]>;
    private readonly allNodeAttributes: Record<string, Record<string, string[]>>;
    private readonly nodeColors: Record<string, string>;

    private variables: { [key: string]: { x: Variable, y: Variable, h: Variable, w: Variable } };

    constructor(graph: Graph, layoutInstance: LayoutInstance, alloyInstance: AlloyInstance) {
        /////////// Constants ///////////
        const DEFAULT_X = 0;
        const DEFAULT_Y = 0;

        const nodeWidth = 50;
        const nodeHeight = 30;
        const minSepHeight = 15;
        const minSepWidth = 15;
        const minSeparation = Math.min(minSepHeight, minSepWidth);
        /////////////////////////////////

        this.layoutInstance = layoutInstance;


        let { groups, attributes, colors } = layoutInstance.applyGraphChangesRequiredByLayout(graph, alloyInstance);
        this.groups = groups;
        this.allNodeAttributes = attributes;
        this.nodeColors = colors;


        this.nodes = graph.nodes().map(node => {

            const attributes = this.allNodeAttributes[node] || {};
            const color = this.nodeColors[node] || "white";

            const h = nodeHeight + minSepHeight;
            const w = nodeWidth + minSepWidth;
            return { id: node, x: DEFAULT_X, y: DEFAULT_Y, width: w, height: h, attributes: attributes, color: color };
        });


        this.edges = graph.edges().map(edge => {
            const edgeId = edge.name;
            const edgeLabel = graph.edge(edge.v, edge.w, edgeId);
            const relName = layoutInstance.getRelationName(graph, edge);
            return { source: edge.v, target: edge.w, relName: relName, label: edgeLabel };
        });

        this.solver = new SimplexSolver();
        this.variables = {};
    }


    public layout(): { nodes: GraphNode[]; edges: GraphEdge[]; groupBoundingBoxes: BoundingBox[] } {


        // Need to ensure that the groups are not exactly on top of each other


        this.nodes.forEach(node => {
            this.variables[node.id] = {
                x: new Variable(`${node}_x`),
                y: new Variable(`${node}_y`),
                h: new Variable(`${node}_h`),
                w: new Variable(`${node}_w`)
            };
            // Try and keep height and width constant, but allow them to change.
            this.solver.addEditVar(this.variables[node.id].h, Strength.strong);
            this.solver.addEditVar(this.variables[node.id].w, Strength.strong);

            this.solver.suggestValue(this.variables[node.id].h, node.height);
            this.solver.suggestValue(this.variables[node.id].w, node.width);


            // Add constraints that the node is within the figure
            this.inFigureConstraint(node.id);
        });

        // For all nodes, make sure they do not overlap
        this.nodes.forEach(node1 => {
            this.nodes.forEach(node2 => {
                if (node1.id !== node2.id) {
                    this.noOverlapConstraint(node1.id, node2.id);
                }
            });
        });

        // Now add the directional constraints
        this.edges.forEach(edge => {

            this.layoutInstance.getFieldLayout(edge.relName).forEach((direction) => {
                if (direction === "left") {
                    this.addLeftConstraint(edge.target, edge.source);
                } else if (direction === "right") {
                    this.addLeftConstraint(edge.source, edge.target);
                }
                else if (direction === "above") {
                    this.addAboveConstraint(edge.target, edge.source);
                } else if (direction === "below") {
                    this.addAboveConstraint(edge.source, edge.target);
                }
            });
        });

        // TODO: Add group constraints

        /************** What is it we want to do here? */
        let group_boundaries : Record<string, BoundingBoxVars> = {};
        Object.entries(this.groups).forEach(([groupName, nodes]) => {

            group_boundaries[groupName] = this.addGroupConstraint(nodes, groupName);

        });



        // Then solve the layout
        this.solver.resolve();


        // Update the graph with the new positions
        this.nodes.forEach(node => {
            const nodeVar = this.variables[node.id];
            node.x = nodeVar.x.value;
            node.y = nodeVar.y.value;
            node.height = nodeVar.h.value;
            node.width = nodeVar.w.value;
        });

        let boundingBoxes : BoundingBox[] = Object.entries(group_boundaries).map(([groupName, boundaries]) => {
            return  {
                topleft_x: boundaries.leftEdge.value,
                topleft_y: boundaries.topEdge.value,
                width: boundaries.rightEdge.value - boundaries.leftEdge.value,
                height: boundaries.bottomEdge.value - boundaries.topEdge.value,
                id : groupName
            };
        });


        // May have to update edges as well
        return { nodes: this.nodes, edges: this.edges, groupBoundingBoxes: boundingBoxes };
    }




    private addLeftConstraint(left: string, right: string): void {
        const leftVar = this.variables[left];
        const rightVar = this.variables[right];

        const leftX = new Expression(leftVar.x);
        const rightX = new Expression(rightVar.x);

        const leftWidth = new Expression(leftVar.w);
        const rightWidth = new Expression(rightVar.w);

        const rightEdgeOfLeft = leftX.plus(leftWidth.divide(new Expression(2)));
        const leftEdgeOfRight = rightX.minus(rightWidth.divide(new Expression(2)));

        try {
            this.solver.addConstraint(new Inequality(rightEdgeOfLeft, LEQ, leftEdgeOfRight, Strength.required));
            //this.solver.addConstraint(new Inequality(leftX, LEQ, rightX), Strength.required)
        }
        catch (e) {
            //e.message = `Error ensuring ${left} was left of ${right}: ${e.message}`;
            console.log(e);
            throw e;
        }
    }

    private addAboveConstraint(above: string, below: string): void {
        const aboveVar = this.variables[above];
        const belowVar = this.variables[below];

        const aboveHeight = new Expression(aboveVar.h);
        const belowHeight = new Expression(belowVar.h);

        let lowerEdgeOfAbove = new Expression(aboveVar.y).plus(aboveHeight.divide(new Expression(2)).plus(this.minNodeSeparation));
        let upperEdgeOfBelow = new Expression(belowVar.y).minus(belowHeight.divide(new Expression(2)).plus(this.minNodeSeparation));
        
        try {
            this.solver.addConstraint(new Inequality(lowerEdgeOfAbove, LEQ, upperEdgeOfBelow, Strength.required));
        }
        catch (e) {

            e.message = `Error ensuring ${above} was above ${below}: ${e.message}`;
            throw e;
        }
    }



    private addGroupConstraint(nodes: string[], groupName: string): BoundingBoxVars {
        // Create variables for the bounding box edges
        const leftEdge = new Variable(`${groupName}_leftEdge`);
        const rightEdge = new Variable(`${groupName}_rightEdge`);
        const topEdge = new Variable(`${groupName}_topEdge`);
        const bottomEdge = new Variable(`${groupName}_bottomEdge`);
    
        // Add constraints to ensure all nodes are within the bounding box
        nodes.forEach(node => {
            const nodeVar = this.variables[node];

            let w = new Expression(nodeVar.w);
            let h = new Expression(nodeVar.h);
            let x = new Expression(nodeVar.x);
            let y = new Expression(nodeVar.y);
    
            // Left edge constraint
            this.solver.addConstraint(new Inequality(x.minus(w.divide(new Expression(2))), GEQ, leftEdge, Strength.required));
    
            // Right edge constraint
            this.solver.addConstraint(new Inequality(x.plus(w.divide(new Expression(2))), LEQ, rightEdge, Strength.required));
    
            // Top edge constraint
            this.solver.addConstraint(new Inequality(y.minus(h.divide(new Expression(2))), GEQ, topEdge, Strength.required));
    
            // Bottom edge constraint
            this.solver.addConstraint(new Inequality(y.plus(h.divide(new Expression(2))), LEQ, bottomEdge, Strength.required));
        });

        return { leftEdge, rightEdge, topEdge, bottomEdge };
    
        // Optionally, add constraints to maintain the size and position of the bounding box
        // this.solver.addConstraint(new Inequality(rightEdge.minus(leftEdge), GEQ, new Expression(this.minNodeSeparation), Strength.required));
        // this.solver.addConstraint(new Inequality(bottomEdge.minus(topEdge), GEQ, new Expression(this.minNodeSeparation), Strength.required));
    }



    private noOverlapConstraint(node1: string, node2: string): void {
        const nodeVar1 = this.variables[node1];
        const nodeVar2 = this.variables[node2];



        const node1X = new Expression(nodeVar1.x);
        const node1Y = new Expression(nodeVar1.y);
        const node1W = new Expression(nodeVar1.w);
        const node1H = new Expression(nodeVar1.h);

        const node2X = new Expression(nodeVar2.x);
        const node2Y = new Expression(nodeVar2.y);
        const node2W = new Expression(nodeVar2.w);
        const node2H = new Expression(nodeVar2.h);

        const distanceToCorner_node1 = Math.sqrt(Math.pow(nodeVar1.w.value, 2) + Math.pow(nodeVar1.h.value, 2)) / 2;
        const distanceToCorner_node2 = Math.sqrt(Math.pow(nodeVar2.w.value, 2) + Math.pow(nodeVar2.h.value, 2)) / 2;
        const md = distanceToCorner_node1 + distanceToCorner_node2; // Ahh I want to use this, but I can't?

        const minDistance = new Expression(md).plus(this.minNodeSeparation);

        // Lets ensure that the centers of the nodes are 'node' distance apart
        const dx = new Expression(nodeVar1.x).minus(nodeVar2.x);
        const dy = new Expression(nodeVar1.y).minus(nodeVar2.y);


        const absDx = new Variable();
        const absDy = new Variable();
        this.solver.addConstraint(new Inequality(absDx, GEQ, dx));
        this.solver.addConstraint(new Inequality(absDx, GEQ, dx.times(-1)));
        this.solver.addConstraint(new Inequality(absDy, GEQ, dy));
        this.solver.addConstraint(new Inequality(absDy, GEQ, dy.times(-1)));

        let distExp = new Expression(absDx).plus(new Expression(absDy));

        try {
            this.solver.addConstraint(new Inequality(distExp, GEQ, minDistance, Strength.required));
        }
        catch (e) {
            console.log(e);
            throw e;
        }

    }

    private inFigureConstraint(node: string): void {
        
        const nodeVar = this.variables[node];

        let nodex = new Expression(nodeVar.x);
        let nodey = new Expression(nodeVar.y);
        let nodeWidth = new Expression(nodeVar.w);
        let nodeHeight = new Expression(nodeVar.h);


        try {
        // Add constraints that the node is within the figure
        this.solver.addConstraint(new Inequality(nodex, GEQ, nodeWidth, Strength.strong));
        this.solver.addConstraint(new Inequality(nodey, GEQ, nodeHeight, Strength.strong));
        }
        catch (e) {
            e.message = `Error ensuring ${node} was within the figure: ${e.message}`;
            console.log(e);
            throw e;
        }
       
    }



}

export { CassowaryLayout };