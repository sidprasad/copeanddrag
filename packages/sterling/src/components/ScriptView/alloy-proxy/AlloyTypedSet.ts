import uniq from 'lodash/uniq';
import { isDefined } from 'ts-is-present';
import { AlloyAtom } from './AlloyAtom';
import { AlloySet, AlloyTuple } from './AlloySet';
import { AlloySignature } from './AlloySignature';
import { AlloyError } from './AlloyError';

class AlloyTypedSet extends AlloySet {

    /**
     * An Alloy type is a _union_ of vectors of sig names, where each vector 
     * has the same length (>=1). 
     */
    private readonly _types: AlloySignature[][];

    constructor (types: AlloySignature[][], tuples: AlloyTuple[]) {

        super(tuples);
        this._types = types;

    }

    project (atoms: Map<AlloySignature, AlloyAtom>): void {

        const projectedAtoms: (AlloyAtom | undefined)[] = 
          uniq(this.types().map(possibleTypes => possibleTypes.map(sig => atoms.get(sig))).flat());

        if (projectedAtoms.some(isDefined)) {

            this._tuples = this.tuples()
                .filter(tuple => {
                    const atoms = tuple.atoms();
                    return atoms.every((atom, index) => projectedAtoms[index] === undefined || projectedAtoms[index] === atom);
                })
                .map(tuple => {
                    return new AlloyTuple(tuple.atoms().filter((atom, index) => {
                        return projectedAtoms[index] === undefined;
                    }));
                });

        }

    }

    types (): AlloySignature[][] {

        return this._types.slice();

    }

    /**
     * Perform a join operation with another set. This operation is equivalent
     * to the dot join operator in Alloy, in which this set is on the left side
     * of the dot and that set is on the right side.
     * 
     * This version of join takes types into account, and will throw an error if 
     * the user attempts to join two relations that can never produce a non-empty join.
     *
     * @param that The other set
     */
    join (that: AlloySet): AlloySet {
        if(that instanceof AlloyTypedSet) {
            const possibleJoinTypes = this.types().map(possType => possType.at(-1))
            const possibleJoinedTypes = that.types().map(possType => possType.at(0))        
            if(!possibleJoinTypes.some(aSig => possibleJoinedTypes.includes(aSig)))
                throw AlloyError.error('Join', `Joining ${this} and ${that} will always be empty.`)
        }

        return super.join(that)
    }

}

export {
    AlloyTypedSet
}
