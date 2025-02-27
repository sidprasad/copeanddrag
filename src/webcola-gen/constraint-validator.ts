import { SimplexSolver, Variable, Expression, Strength, Inequality, LEQ, GEQ, LE } from 'cassowary';
import { NodeWithMetadata } from './graphtowebcola';
import { intersection } from 'lodash';
import { relative } from 'path';


/*
    Deprecated. Moving to layout\constraint-validator.ts
*/
class ColaConstraintValidator {

    private webcolaConstraints: any[];
    private solver: SimplexSolver;
    private colaNodes: NodeWithMetadata[];

    private variables: { [key: string]: { x: Variable, y: Variable } };

    private added_constraints: any[];
    private groups: any[];
    error: string;

    constructor(webcolaConstraints: any[], nodes: NodeWithMetadata[], groups: any[]) {
        this.webcolaConstraints = webcolaConstraints;
        this.solver = new SimplexSolver();
        this.colaNodes = nodes;
        this.variables = {};
        this.groups = groups;
        this.added_constraints = [];
        this.error = null;
    }

    public validateConstraints(): string {
        // I think this works, but I need to test it
        return this.validateGroupConstraints() || this.validatePositionalConstraints();
    }

    public validatePositionalConstraints(): string {

        this.colaNodes.forEach(node => {
            let index = this.getNodeIndex(node.id);
            this.variables[index] = {
                x: new Variable(`${node.id}_x`),
                y: new Variable(`${node.id}_y`),
            };
        });

        for (let i = 0; i < this.webcolaConstraints.length; i++) {
            let constraint = this.webcolaConstraints[i];
            this.webColaToCassowary(constraint);
            if (this.error) {
                return this.error;
            }
        }


        this.solver.solve();
        return this.error;
    }

    private getGroupIndex(groupName: string) {
        return this.groups.findIndex(group => group.name === groupName);
    }

    public validateGroupConstraints(): string {

        let overlappingNonSubgroups = false;

        this.groups.forEach(group => {
            this.groups.forEach(otherGroup => {

                const groupIndex = this.getGroupIndex(group.name);
                const otherGroupIndex = this.getGroupIndex(otherGroup.name);

                if (groupIndex === otherGroupIndex || overlappingNonSubgroups) {
                    return;
                }


                if (!this.isSubGroup(group, otherGroup) && !this.isSubGroup(otherGroup, group)) {

                    let intersection = this.groupIntersection(group, otherGroup);
                    overlappingNonSubgroups = intersection.length > 0;

                    if(overlappingNonSubgroups) {
                        let intersectingGroupNames = intersection.map((index) => this.colaNodes[index].id).join(', ');

                        this.error = `Layout not satisfiable! [ ${intersectingGroupNames} ] are in groups ${group.name} and ${otherGroup.name}, but neither group is contained in the other. Groups must be either nested or disjoint.`;
                    }
                }
            })
        });




        return this.error;
    }

    private getNodeIndex(nodeId: string) {
        return this.colaNodes.findIndex(node => node.id === nodeId);
    }



    private colaOrientationConstraintToString(constraint) {

        let axis = constraint.axis;
        let equality = constraint?.equality || false;

        let left_idx = constraint.left;
        let right_idx = constraint.right;

        let left = this.colaNodes[left_idx].id;
        let right = this.colaNodes[right_idx].id;
        let relativePosition = axis === 'x' ? 'to the left of ' : 'above ';
        if (equality) {
            if (axis === 'y') {
                relativePosition = 'horizontally aligned with ';
            }
            else if (axis === 'x') {
                relativePosition = 'vertically aligned with ';
            }
        }

        return `ENSURE: ${left} is ${relativePosition} ${right}`;


    }


    private webColaToCassowary(constraint) {
        let axis = constraint.axis;
        let strength = Strength.required;

        let equality = constraint?.equality || false;

        let left = constraint.left;
        let right = constraint.right;
        let gap = constraint.gap;

        let leftVar = this.variables[left][axis];
        let rightVar = this.variables[right][axis];

        let lhs = new Expression(leftVar)
            .plus(new Expression(gap));

        let rhs = new Expression(rightVar);



        try {
            this.solver.addConstraint(new Inequality(lhs, LEQ, rhs, strength));

            if(equality) {
                this.solver.addConstraint(new Inequality(lhs, GEQ, rhs, strength));
            }
            this.added_constraints.push(constraint);
        }
        catch (e) {

            
            let previousConstraintList = this.added_constraints.map((c) => this.colaOrientationConstraintToString(c));
            let previousConstraintSet = new Set(previousConstraintList);
            previousConstraintList = [...previousConstraintSet];

            let previousConstraintString = "<br><br>" + previousConstraintList.map((c) => "<code>" + c + "</code>").join('<br>');

            let currentConstraintString = this.colaOrientationConstraintToString(constraint);
            this.error = `Constraint:<br> <code>${currentConstraintString}</code><br> conflicts with one (or some) the following constraints:` + previousConstraintString;
            console.log(e);
            return;
        }

    }


    // TODO: Is this correct?    
    private isSubGroup(subgroup, group): boolean {

        if (subgroup === group) {
            return true;
        }
        const immediateSubgroups = group.groups;

        if (!immediateSubgroups || immediateSubgroups.length === 0) {
            return false;
        }

        if (immediateSubgroups.includes(this.getGroupIndex(subgroup))) {
            return true;
        }
        return immediateSubgroups.some((sg) => this.isSubGroup(subgroup, this.groups[sg]));
    }




    private getAllLeaves(group): Set<number> {
        const leaves: Set<number> = group.leaves ? new Set(group.leaves) : new Set();
        const subGroups = group.groups;
        if (!subGroups) {
            return leaves;
        }

        let subGroupLeaves: Set<number>[] = subGroups.map((subgroup) => this.getAllLeaves(this.groups[subgroup]));

        // Now get the union set of leaves and subGroupLeaves
        subGroupLeaves.forEach((subGroupLeafSet) => {
            subGroupLeafSet.forEach((leaf) => leaves.add(leaf));
        });

        return leaves;
    }


    private groupIntersection(group1, group2): number[] {
        const leaves1 = this.getAllLeaves(group1);
        const leaves2 = this.getAllLeaves(group2);

        return intersection([...leaves1], [...leaves2]);
    }
}


//export { ConstraintValidator };