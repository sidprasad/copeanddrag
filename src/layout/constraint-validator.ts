import { SimplexSolver, Variable, Expression, Strength, Inequality, LEQ, GEQ, LE } from 'cassowary';
import { intersection } from 'lodash';
import { InstanceLayout, LayoutNode, LayoutEdge, LayoutGroup, LayoutConstraint, isLeftConstraint, isTopConstraint, isAlignmentConstraint, TopConstraint, LeftConstraint, AlignmentConstraint } from './interfaces';

/// TODO: Should examine LAYOUT CONSTRAINTS NOT COLA CONSTRAINTS
class ConstraintValidator {

    private solver: SimplexSolver;
    private variables: { [key: string]: { x: Variable, y: Variable } };

    private added_constraints: any[];
    error: string;

    orientationConstraints: LayoutConstraint[];
    nodes: LayoutNode[];
    edges: LayoutEdge[];
    groups: LayoutGroup[];


    public horizontallyAligned: LayoutNode[][] = [];
    public verticallyAligned: LayoutNode[][] = [];

    constructor(layout: InstanceLayout) {

        this.solver = new SimplexSolver();
        this.nodes = layout.nodes;
        this.edges = layout.edges;
        this.orientationConstraints = layout.constraints;
        this.variables = {};
        this.groups = layout.groups;
        this.added_constraints = [];
        this.error = null;
    }

    public validateConstraints(): string {
        // I think this works, but I need to test it
        return this.validateGroupConstraints() || this.validatePositionalConstraints();
    }

    public validatePositionalConstraints(): string {

        this.nodes.forEach(node => {
            let index = this.getNodeIndex(node.id);
            this.variables[index] = {
                x: new Variable(`${node.id}_x`),
                y: new Variable(`${node.id}_y`),
            };
        });

        for (let i = 0; i < this.orientationConstraints.length; i++) {
            let constraint = this.orientationConstraints[i];
            this.constraintToCassowary(constraint);
            if (this.error) {
                return this.error;
            }
        }
        this.getAlignmentOrders();

        // Now that the solver has solved, we can get an ALIGNMENT ORDER for the nodes.


        // How do we get the solution?



        return this.error;
    }

    private getGroupIndex(groupName: string) {
        return this.groups.findIndex(group => group.name === groupName);
    }

    public validateGroupConstraints(): string {

        // This identifies if there ARE any overlapping non-subgroups
        let overlappingNonSubgroups = false;
        
        this.groups.forEach(group => {
            this.groups.forEach(otherGroup => {

                // const groupIndex = this.getGroupIndex(group.name);
                // const otherGroupIndex = this.getGroupIndex(otherGroup.name);

                if (group.name === otherGroup.name || overlappingNonSubgroups) {
                    return;
                }


                if (!this.isSubGroup(group, otherGroup) && !this.isSubGroup(otherGroup, group)) {

                    let intersection = this.groupIntersection(group, otherGroup);
                    overlappingNonSubgroups = intersection.length > 0;

                    if (overlappingNonSubgroups) {
                        let intersectingGroupNames = intersection.join(', ');
                        this.error = `Layout not satisfiable! [ ${intersectingGroupNames} ] are in groups ${group.name} and ${otherGroup.name}, but neither group is contained in the other. Groups must be either nested or disjoint.`;
                    }
                }
            })
        });
        return this.error;
    }

    private getNodeIndex(nodeId: string) {
        return this.nodes.findIndex(node => node.id === nodeId);
    }

    private orientationConstraintToString(constraint) {

        if (isTopConstraint(constraint)) {
            let tc = constraint as TopConstraint;
            return `ENSURE: ${tc.top.id} is above ${tc.bottom.id}`;
        }
        else if (isLeftConstraint(constraint)) {
            let lc = constraint as LeftConstraint;
            return `ENSURE: ${lc.left.id} is to the left of ${lc.right.id}`;
        }
        else if (isAlignmentConstraint(constraint)) {
            let ac = constraint as AlignmentConstraint;
            let axis = ac.axis;
            let node1 = ac.node1;
            let node2 = ac.node2;

            if (axis === 'x') {
                return `ENSURE: ${node1.id} is vertically aligned with ${node2.id}`;
            }
            else if (axis === 'y') {
                return `ENSURE: ${node1.id} is horizontally aligned with ${node2.id}`;
            }

            return `ENSURE: ${node1.id} is aligned with ${node2.id} along the ${axis} axis`;
        }
        return `ENSURE: Unknown constraint type: ${constraint}`;
    }

    private constraintToCassowary(constraint: LayoutConstraint) {
        try {
            if (isTopConstraint(constraint)) {
                let tc = constraint as TopConstraint;

                let top = tc.top;
                let bottom = tc.bottom;
                let minDistance = tc.minDistance;

                const topId = this.getNodeIndex(top.id);
                const bottomId = this.getNodeIndex(bottom.id);

                let topVar = this.variables[topId].y;
                let bottomVar = this.variables[bottomId].y;

                let lhs = new Expression(topVar)
                    .plus(new Expression(minDistance));
                let rhs = new Expression(bottomVar);

                this.solver.addConstraint(new Inequality(lhs, LEQ, rhs, Strength.required));
            }
            else if (isLeftConstraint(constraint)) {
                let lc = constraint as LeftConstraint;

                let left = lc.left;
                let right = lc.right;
                let minDistance = lc.minDistance;

                const leftId = this.getNodeIndex(left.id);
                const rightId = this.getNodeIndex(right.id);

                let leftVar = this.variables[leftId].x;
                let rightVar = this.variables[rightId].x;

                let lhs = new Expression(leftVar)
                    .plus(new Expression(minDistance));
                let rhs = new Expression(rightVar);

                this.solver.addConstraint(new Inequality(lhs, LEQ, rhs, Strength.required));
            }
            else if (isAlignmentConstraint(constraint)) {


                // This is trickier. We want to REGISTER alignment AS WELL.

                let ac = constraint as AlignmentConstraint;
                let axis = ac.axis;
                let node1 = ac.node1;
                let node2 = ac.node2;

                const node1Id = this.getNodeIndex(node1.id);
                const node2Id = this.getNodeIndex(node2.id);

                let node1Var = this.variables[node1Id][axis];
                let node2Var = this.variables[node2Id][axis];

                let lhs = new Expression(node1Var);
                let rhs = new Expression(node2Var);

                this.solver.addConstraint(new Inequality(lhs, LEQ, rhs, Strength.required));
                this.solver.addConstraint(new Inequality(lhs, GEQ, rhs, Strength.required));


                // And register the alignment
                if (axis === 'x') {
                    this.verticallyAligned.push([node1, node2]);
                }
                else if (axis === 'y') {
                    this.horizontallyAligned.push([node1, node2]);
                }
            }
            else {
                console.log(constraint, "Unknown constraint type");
                this.error = "Unknown constraint type";
            }
            this.added_constraints.push(constraint);
        }
        catch (e) {
               
            let previousConstraintList = this.added_constraints.map((c) => this.orientationConstraintToString(c));
            let previousConstraintSet = new Set(previousConstraintList);
            previousConstraintList = [...previousConstraintSet];

            let previousConstraintString = "<br><br>" + previousConstraintList.map((c) => "<code>" + c + "</code>").join('<br>');

            let currentConstraintString = this.orientationConstraintToString(constraint);
            this.error = `Constraint:<br> <code>${currentConstraintString}</code><br> conflicts with one (or some) the following constraints:` + previousConstraintString;
            console.log(e);
            return;
        }
    }

    private getAlignmentOrders(): void {
        // Make sure the solver has solved
        this.solver.solve();

        // Now first, create the normalized groups.
        this.horizontallyAligned = this.normalizeAlignment(this.horizontallyAligned);
        this.verticallyAligned = this.normalizeAlignment(this.verticallyAligned);

        // Now we need to get the order of the nodes in each group
        for (let i = 0; i < this.horizontallyAligned.length; i++) {
            this.horizontallyAligned[i].sort((a, b) => this.variables[this.getNodeIndex(a.id)].x.value - this.variables[this.getNodeIndex(b.id)].x.value);
        }

        for (let i = 0; i < this.verticallyAligned.length; i++) {
            this.verticallyAligned[i].sort((a, b) => this.variables[this.getNodeIndex(a.id)].y.value - this.variables[this.getNodeIndex(b.id)].y.value);
        }

    }


    private normalizeAlignment(aligned: LayoutNode[][]): LayoutNode[][] {
        const merged: LayoutNode[][] = [];


        /*
        Initial Merging: The first loop iterates over each group in the aligned array and checks if it has any common elements with the existing groups in the merged array. If it does, it merges them.
        */

        for (const group of aligned) {
            let mergedWithExisting = false;

            for (const existing of merged) {
                if (group.some(item => existing.includes(item))) {
                    existing.push(...group.filter(item => !existing.includes(item)));
                    mergedWithExisting = true;
                    break;
                }
            }

            if (!mergedWithExisting) {
                merged.push([...group]);
            }
        }

        // Final pass to ensure full transitive closure
        let changed = true;
        while (changed) {
            changed = false;
            for (let i = 0; i < merged.length; i++) {
                for (let j = i + 1; j < merged.length; j++) {
                    if (merged[i].some(item => merged[j].includes(item))) {
                        merged[i].push(...merged[j].filter(item => !merged[i].includes(item)));
                        merged.splice(j, 1);
                        changed = true;
                        break;
                    }
                }
                if (changed) break;
            }
        }

        return merged;
    }



    private isSubGroup(subgroup : LayoutGroup, group : LayoutGroup): boolean {
        const sgElements = subgroup.nodeIds;
        const gElements = group.nodeIds;
        return sgElements.every((element) => gElements.includes(element));
    }



    private groupIntersection(group1 : LayoutGroup, group2 : LayoutGroup): string[] {
        const g1Elements = group1.nodeIds;
        const g2Elements = group2.nodeIds;

        // Get elements that are in both groups
        const commonElements = intersection(g1Elements, g2Elements);
        return commonElements;
    }
}


export { ConstraintValidator };