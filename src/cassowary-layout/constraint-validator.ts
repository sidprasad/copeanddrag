import {SimplexSolver, Variable, Expression, Strength, Inequality, LEQ, GEQ, LE} from 'cassowary';
import {NodeWithMetadata} from '../webcola-gen/graphtowebcola';

class ConstraintValidator {

    private webcolaConstraints: any[];
    private solver: SimplexSolver;
    private colaNodes : NodeWithMetadata[];

    private variables: { [key: string]: { x: Variable, y: Variable } };

    error : string;



    constructor(webcolaConstraints : any[], nodes : NodeWithMetadata[]) {
        this.webcolaConstraints = webcolaConstraints;
        this.solver = new SimplexSolver();
        this.colaNodes = nodes;
        this.variables = {};

        this.error = null;
    }

    getNodeIndex(nodeId: string) {
        return this.colaNodes.findIndex(node => node.id === nodeId);
    }


    validateConstraints() : string {

        this.colaNodes.forEach(node => {
            let index = this.getNodeIndex(node.id);
            this.variables[index] = {
                x: new Variable(`${node.id}_x`),
                y: new Variable(`${node.id}_y`),
            };
        });

        this.webcolaConstraints.forEach(constraint => {
            this.webColaToCassowary(constraint);
        });

        this.solver.solve();
        return this.error;
    }


    webColaToCassowary(constraint) {

        // Parse the webcola constraints into cassowary constraints

        let axis = constraint.axis;
        let left = constraint.left;
        let right = constraint.right;
        let gap = constraint.gap;
        
        let leftVar = this.variables[left][axis];
        let rightVar = this.variables[right][axis];

        let lhs = new Expression(leftVar)
                    .plus(new Expression(gap));

        let rhs = new Expression(rightVar);

        let strength = Strength.required;

        try {
            this.solver.addConstraint(new Inequality( lhs, LEQ, rhs, strength));
        }
        catch (e) {


            let leftNodeName = this.colaNodes[left].id;
            let rightNodeName = this.colaNodes[right].id

            if (axis === 'x') {
                this.error = `Layout not satisfiable! Could not place ${leftNodeName} to the left ${rightNodeName} and satisfy other constraints.`;
            }
            else if (axis === 'y') {
                this.error = `Layout not satisfiable! Could not place ${leftNodeName} above ${rightNodeName} and satisfy other constraints.`;
            }
            else {
                this.error = `Layout not satisfiable! Could not place ${leftNodeName} in relation to ${rightNodeName} and satisfy other constraints.`;
            }
            console.log(e);
            return;
        }

    }
}


export { ConstraintValidator };