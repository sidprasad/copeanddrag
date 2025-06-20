import { SimplexSolver, Variable, Expression, Strength, Inequality, LEQ, GEQ, LE } from 'cassowary';
import { intersection } from 'lodash';
import { InstanceLayout, LayoutNode, LayoutEdge, LayoutGroup, LayoutConstraint, isLeftConstraint, isTopConstraint, isAlignmentConstraint, TopConstraint, LeftConstraint, AlignmentConstraint, ImplicitConstraint } from './interfaces';
import { RelativeOrientationConstraint } from './layoutspec';
import { v4 as uuidv4 } from 'uuid';


import ejs from 'ejs';
import fs from 'fs';
import path from 'path';

// const templatePath = path.join(__dirname, 'constrainterr.ejs');
// console.log("Using template at:", templatePath);
const errorTemplate = `  
  <div class="mb-3">
    <div style="display: flex; gap: 1rem; overflow-x: auto;">
      <div class="card flex-shrink-0" style="min-width: 320px; max-width: 100%;">
        <div class="card-header bg-light">
          <strong>In terms of CnD</strong>
        </div>
        <div class="card-body">

            Constraint: <br> <code> <%- conflictingSourceConstraint%> </code><br> conflicts with one (or some) the 
            following source constraints: <br>


            <% Object.entries(previousSourceConstraintToLayoutConstraints).forEach(function([key, item]) { %>
                <code class="highlight <%= item.uid %>"><%- key %></code>
                <br>
            <% }); %>




        </div>
      </div>
      <div class="card flex-shrink-0" style="min-width: 320px; max-width: 100%;">
        <div class="card-header bg-light">
          <strong>In terms of diagram elements</strong>
        </div>
        <div class="card-body">
          

            Constraint: <br> <code> <%- conflictingConstraint%> </code><br> conflicts with the 
            following constraints: <br>


            <% Object.entries(previousSourceConstraintToLayoutConstraints).forEach(function([sourceKey, value]) { %>
                <% value.layoutConstraints.forEach(function(layoutConstraint) { %>
                    <div class="highlight <%= value.uid %>">
                    <code><%- layoutConstraint %></code>
                    </div>
                <% }); %>
            <% }); %>

        </div>
      </div>
    </div>
  </div>

  <script>
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.highlight').forEach(function(el) {
    el.addEventListener('mouseenter', function() {
      // Get all classes except 'highlight'
      const requiredClasses = Array.from(el.classList).filter(c => c !== 'highlight');
      if (requiredClasses.length === 0) return;
      // Highlight any element that has all requiredClasses (regardless of extras)
      document.querySelectorAll('*').forEach(function(otherEl) {
        if (requiredClasses.every(cls => otherEl.classList.contains(cls))) {
          otherEl.classList.add('highlighted');
        }
      });
    });
    el.addEventListener('mouseleave', function() {
      document.querySelectorAll('.highlighted').forEach(function(sharedEl) {
        sharedEl.classList.remove('highlighted');
      });
    });
  });
});
</script>

<style>
.highlighted {
  background-color: yellow; /* or your highlight style */
}
</style>`;


class ConstraintValidator {

    private solver: SimplexSolver;
    private variables: { [key: string]: { x: Variable, y: Variable } };

    private added_constraints: any[];
    error: string;

    layout: InstanceLayout;
    orientationConstraints: LayoutConstraint[];
    nodes: LayoutNode[];
    edges: LayoutEdge[];
    groups: LayoutGroup[];
    minPadding: number = 15;

    public horizontallyAligned: LayoutNode[][] = [];
    public verticallyAligned: LayoutNode[][] = [];

    constructor(layout: InstanceLayout) {
        this.layout = layout;
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
            let constraint = this.orientationConstraints[i]; // TODO: This changes?
            this.addConstraintToSolver(constraint);
            if (this.error) {
                return this.error;
            }
        }

        this.solver.solve();

        //// TODO: Does adding these play badly when we have circular layouts?

        // Now that the solver has solved, we can get an ALIGNMENT ORDER for the nodes.
        let and_more_constraints = this.getAlignmentOrders();
        
        // Now add THESE constraints to the layout constraints
        this.layout.constraints = this.layout.constraints.concat(and_more_constraints);

        return this.error;
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


    //Find the SMALLEST subset of consistentConstraints that is inconsistent with conflictingConstraint

    // This is still only LOCALLY minimal.
    private getMinimalConflictingConstraints(consistentConstraints: LayoutConstraint[], conflictingConstraint: LayoutConstraint): LayoutConstraint[] {
        // Start with all consistent constraints plus the conflicting one
        let core = [...consistentConstraints, conflictingConstraint];
        let changed = true;

        // Only try removing from the consistent constraints, not the conflicting one (which must be present)
        while (changed) {
            changed = false;
            for (let i = 0; i < core.length - 1; i++) { // -1 to always keep conflictingConstraint
                let testSet = core.slice(0, i).concat(core.slice(i + 1));
                let solver = new SimplexSolver();
                try {
                    for (const c of testSet) {


                        let cassowaryConstraints = this.constraintToCassowary(c);
                        // Add the Cassowary constraints to the solver
                        cassowaryConstraints.forEach((cassowaryConstraint) => {
                            // console.log("Adding constraint to solver:", cassowaryConstraint);
                            // console.log("Constraint to add:", this.orientationConstraintToString(c));
                            // console.log("Cassowary constraint:", cassowaryConstraint);
                            solver.addConstraint(cassowaryConstraint);
                        });
                    }
                    solver.solve();
                    // If no error, this subset is satisfiable, so keep the constraint in the core
                } catch {
                    // Still unsat, so we can remove this constraint from the core
                    core = testSet;
                    changed = true;
                    break;
                }
            }
        }
        // Return only the minimal subset of consistentConstraints (excluding the conflictingConstraint)
        return core.filter(c => c !== conflictingConstraint);
    }

    private constraintToCassowary(constraint: LayoutConstraint) : any[] {
        // This is the main method that converts a LayoutConstraint to a Cassowary constraint.
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

                return [new Inequality(lhs, LEQ, rhs, Strength.required)];
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

                return [new Inequality(lhs, LEQ, rhs, Strength.required)];
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

             

                // And register the alignment
                if (axis === 'x') {
                    this.verticallyAligned.push([node1, node2]);
                }
                else if (axis === 'y') {
                    this.horizontallyAligned.push([node1, node2]);
                }

                return [new Inequality(lhs, LEQ, rhs, Strength.required),
                        new Inequality(lhs, GEQ, rhs, Strength.required)];
            }
            else {
                console.log(constraint, "Unknown constraint type");
                this.error = "Unknown constraint type";
                return [];
            }
    }

    // TODO: Factor out the constraintToCassowary bit. from the ADD to solver.
    private addConstraintToSolver(constraint: LayoutConstraint) {
        try {
            let cassowaryConstraints = this.constraintToCassowary(constraint);
            cassowaryConstraints.forEach((cassowaryConstraint) => {
                this.solver.addConstraint(cassowaryConstraint);
            });
            this.added_constraints.push(constraint);
        }
        catch (e) {

            const minimal_conflicting_constraints = this.getMinimalConflictingConstraints(this.added_constraints, constraint);

            // let previousSourceConstraintSet = new Set(minimal_conflicting_constraints.map((c) => c.sourceConstraint).map((c) => c.toHTML()));
            // let previousSourceConstraints = [...previousSourceConstraintSet];


            // TODO: We want to invert this mapping so 
            // that we can map a source constraint to several layout constraints.

            let sourceConstraintToLayoutConstraints = {};

            minimal_conflicting_constraints.forEach((c) => {


                //// TODO: THIS IS WRONG!!

                // Use a unique identifier for the source constraint as the key
                let sourceKey = c.sourceConstraint.toHTML(); // or another unique property
                let layoutConstraintHTML = this.orientationConstraintToString(c);
                let uid = uuidv4();

                

                if (!sourceConstraintToLayoutConstraints[sourceKey]) {
                    sourceConstraintToLayoutConstraints[sourceKey] = {
                        uid : uid,
                        layoutConstraints: []
                    };
                }
                sourceConstraintToLayoutConstraints[sourceKey].layoutConstraints.push(layoutConstraintHTML);
            });



            let conflictingConstraint = this.orientationConstraintToString(constraint);
            let conflictingSourceConstraint = constraint.sourceConstraint.toHTML();
            
            const context = {
                conflictingConstraint: conflictingConstraint,
                conflictingSourceConstraint: conflictingSourceConstraint,
                previousSourceConstraintToLayoutConstraints: sourceConstraintToLayoutConstraints,

            };
               
            this.error = ejs.render(errorTemplate, context);
            return;
        }
    }

    private getAlignmentOrders(): LayoutConstraint[] {
        // Make sure the solver has solved
        this.solver.solve();

        // Now first, create the normalized groups.
        this.horizontallyAligned = this.normalizeAlignment(this.horizontallyAligned);
        this.verticallyAligned = this.normalizeAlignment(this.verticallyAligned);

        let implicitAlignmentConstraints = [];


        // Now we need to get the order of the nodes in each group
        for (let i = 0; i < this.horizontallyAligned.length; i++) {
            this.horizontallyAligned[i].sort((a, b) => this.variables[this.getNodeIndex(a.id)].x.value - this.variables[this.getNodeIndex(b.id)].x.value);   
        }

        this.horizontallyAligned.forEach((alignedLeftToRight) => {

            for (let i = 0; i < alignedLeftToRight.length - 1; i++) {
                let node1 = alignedLeftToRight[i];
                let node2 = alignedLeftToRight[i + 1];


                let roc : RelativeOrientationConstraint = new RelativeOrientationConstraint(['directlyLeft'], `${node1.id}->${node2.id}`);
                let sourceConstraint = new ImplicitConstraint(roc, "Preventing Overlap");

                let lc : LeftConstraint =  { 
                    left: node1, 
                    right: node2,
                    minDistance: this.minPadding,
                    // sourceConstraint is ``implied'' or ``implicit'' here, since it is derived from the alignment order. That's tricky.
                    sourceConstraint: sourceConstraint
                };

                implicitAlignmentConstraints.push(lc);
            }

        });


        for (let i = 0; i < this.verticallyAligned.length; i++) {
            this.verticallyAligned[i].sort((a, b) => this.variables[this.getNodeIndex(a.id)].y.value - this.variables[this.getNodeIndex(b.id)].y.value);
        }


        this.verticallyAligned.forEach((alignedTopToBottom) => {

            for (let i = 0; i < alignedTopToBottom.length - 1; i++) {
                let node1 = alignedTopToBottom[i];
                let node2 = alignedTopToBottom[i + 1];

                let roc : RelativeOrientationConstraint = new RelativeOrientationConstraint(['directlyAbove'], `${node1.id}->${node2.id}`);
                let sourceConstraint = new ImplicitConstraint(roc, "Preventing Overlap");

                let tc : TopConstraint =  { 
                    top: node1, 
                    bottom: node2,
                    minDistance: this.minPadding,
                    sourceConstraint: sourceConstraint
                };
                implicitAlignmentConstraints.push(tc);
            }
        });


        return implicitAlignmentConstraints;
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