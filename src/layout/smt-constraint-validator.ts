import {init} from 'z3-solver';
import { intersection } from 'lodash';
import {
  InstanceLayout, LayoutNode, LayoutEdge, LayoutGroup, LayoutConstraint,
  isLeftConstraint, isTopConstraint, isAlignmentConstraint,
  TopConstraint, LeftConstraint, AlignmentConstraint
} from './interfaces';
import { RelativeOrientationConstraint } from './layoutspec';

class SMTConstraintValidator {
    private variables: { [key: string]: { x: any, y: any } };
    error: string | null;

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
        this.nodes = layout.nodes;
        this.edges = layout.edges;
        this.orientationConstraints = layout.constraints;
        this.variables = {};
        this.groups = layout.groups;
        this.error = null;
    }

    public async validateConstraints(): Promise<string | null> {
        // Initialize Z3 context
        const {
            Z3, // Low-level C-like API
            Context, // High-level Z3Py-like API
            } = await init();


        const ctx = await Context('main');
        this.error = null;
        this.horizontallyAligned = [];
        this.verticallyAligned = [];
        this.variables = {};

        // Create Z3 variables for each node
        this.nodes.forEach(node => {
            this.variables[node.id] = {
                x: ctx.Int.const(`${node.id}_x`),
                y: ctx.Int.const(`${node.id}_y`)
            };
        });

        const solver = new ctx.Solver();
        const tracked: { [name: string]: any } = {};

        // Add constraints, tracking each for unsat core
        for (let i = 0; i < this.orientationConstraints.length; i++) {
            const constraint = this.orientationConstraints[i];
            const [z3expr, name] = this.constraintToZ3(ctx, constraint);
            if (z3expr && name) {
                solver.assertAndTrack(z3expr, ctx.Bool.const(name));
                tracked[name] = constraint;
            }
        }

        // Solve
        const result = await solver.check();
        if (result === 'unsat') {
            const core = await solver.unsatCore();
            const coreNames = core.map((b: any) => b.toString());
            const coreConstraints = coreNames.map(n => tracked[n]);
            this.error = this.formatUnsatError(coreConstraints);
            return this.error;
        }

        return null;
    }

    // Pass ctx explicitly!
    private constraintToZ3(ctx: Awaited<ReturnType<typeof z3.Context>>, constraint: LayoutConstraint): [any, string] {
        if (isTopConstraint(constraint)) {
            const tc = constraint as TopConstraint;
            const topVar = this.variables[tc.top.id].y;
            const bottomVar = this.variables[tc.bottom.id].y;
            const minDistance = tc.minDistance ?? this.minPadding;
            return [topVar.add(minDistance).le(bottomVar), `top_${tc.top.id}_above_${tc.bottom.id}`];
        }
        if (isLeftConstraint(constraint)) {
            const lc = constraint as LeftConstraint;
            const leftVar = this.variables[lc.left.id].x;
            const rightVar = this.variables[lc.right.id].x;
            const minDistance = lc.minDistance ?? this.minPadding;
            return [leftVar.add(minDistance).le(rightVar), `left_${lc.left.id}_leftof_${lc.right.id}`];
        }
        if (isAlignmentConstraint(constraint)) {
            const ac = constraint as AlignmentConstraint;
            const axis = ac.axis;
            const node1Var = this.variables[ac.node1.id][axis];
            const node2Var = this.variables[ac.node2.id][axis];
            return [node1Var.eq(node2Var), `align_${ac.node1.id}_${ac.node2.id}_${axis}`];
        }
        return [null, 'unknown'];
    }

    private formatUnsatError(coreConstraints: LayoutConstraint[]): string {
        return `
        <div class="alert alert-danger">
            <strong>Layout not satisfiable!</strong><br>
            The following constraints are in conflict:<br>
            <ul>
                ${coreConstraints.map(c => `<li>${this.orientationConstraintToString(c)}</li>`).join('\n')}
            </ul>
        </div>
        `;
    }

    private orientationConstraintToString(constraint: LayoutConstraint): string {
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
}

export { SMTConstraintValidator };