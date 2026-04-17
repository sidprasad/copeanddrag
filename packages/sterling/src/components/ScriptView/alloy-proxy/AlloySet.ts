import { AlloyAtom } from './AlloyAtom';
import { AlloyError } from './AlloyError';
import { AlloySignature } from './AlloySignature';

class AlloySet {
    protected _tuples: AlloyTuple[];

    /**
     * Create a new Alloy set.
     *
     * @param tuples The tuples contained in the set
     */
    constructor (tuples?: AlloyTuple[]) {

        this._tuples = tuples || [];

    }

    /**
     * Returns true if the set is empty, false if it is not.
     */
    empty (): boolean {

        return this._tuples.length === 0;

    }

    /**
     * Returns true if this set is equivalent to the provided set, false otherwise.
     * @param that The set to compare to
     */
    equals (that: AlloySet): boolean {

        return this.toString() === that.toString();

    }

    /**
     * Returns true if this set is a subset of the provided set, false otherwise.
     * @param that The set to compare to
     */
    in (that: AlloySet): boolean {

        const thatSet = new Set(that.tuples().map(tuple => tuple.toString()));
        return this.tuples().every(tuple => thatSet.has(tuple.toString()));

    }

    /**
     * Perform a join operation with another set. This operation is equivalent
     * to the dot join operator in Alloy, in which this set is on the left side
     * of the dot and that set is on the right side.
     *
     * This method relies on object equality between AlloyAtom objects having the same id().
     * 
     * @param that The other set
     */
    join (that: AlloySet): AlloySet {
        // Because this function is often called directly in a user script, and (as of 2023)
        // that script is JavaScript, not TypeScript, the type of `that` may not be sound. 
        if(Array.isArray(that))
            throw AlloyError.error('AlloySet', `[${that}] is an array, not an AlloySet, so unable to apply join.`)
        if(!(that instanceof AlloySet)) 
            throw AlloyError.error('AlloySet', `${that} is something other than an AlloySet, so unable to apply join.`)

        if (!this.tuples().length || !that.tuples().length)
            return new AlloySet();        

        const tupleMap = mapColumnToTuples(0, that.tuples());
        const joinTups: AlloyTuple[] = [];
        const i = this._tuples[0].atoms().length - 1;        

        this.tuples().forEach(tuple => {
            const atom: AlloyAtom = tuple.atoms()[i];
            const tupsInThat = tupleMap.get(atom.id());
            if (tupsInThat) tupsInThat.forEach(tup => {
                const atoms = tuple.atoms()
                    .slice(0, -1)
                    .concat(...tup.atoms().slice(1));
                joinTups.push(new AlloyTuple(atoms));
            });
        });

        return new AlloySet(removeDuplicateTuples(joinTups));

    }

    /**
     * Create a printable string representation of this set.
     */
    toString (): string {

        return this._tuples.map(tuple => tuple.toString()).join('\n');

    }

    /**
     * Get an array of all tuples in this set.
     */
    tuples (): AlloyTuple[] {

        return this._tuples.slice();

    }

}

class AlloyTuple extends AlloySet {

    private _atoms: AlloyAtom[];

    /**
     * Create a new Alloy tuple.
     *
     * @param atoms The atoms, in order, that comprise the tuple.
     */
    constructor (atoms: AlloyAtom[]) {

        super();
        this._tuples = [this];
        this._atoms = atoms;

    }

    /**
     * Get an ordered list of the atoms in this tuple.
     */
    atoms (): AlloyAtom[] {

        return this._atoms.slice();

    }

    /**
     * Create a printable string representation of this tuple.
     */
    toString (): string {

        return this._atoms.map(atom => atom.id()).join(', ');

    }

    /**
     * Create an array of tuples from a node list of ```<tuples>``` XML elements.
     *
     * @param elements A node list of ```<tuples>``` elements, typically created
     * using the ```querySelectorAll()``` method on a ```<field>``` or
     * ```<skolem>``` element.
     * @param types An array of ordered arrays of signatures. Each sub-array defines
     * define a potential type for each atom in a tuple, typically created using
     * [[AlloySignature.typesFromXML]].
     */
    static tuplesFromXML (elements: NodeListOf<Element>, allTypes: AlloySignature[][]): AlloyTuple[] {        
        return Array.from(elements).map(tupleElement => {
            // If there's only one possible type, use it (and error if there's a problem)
            if(allTypes.length === 1) 
                return AlloyTuple.buildTuple(allTypes[0], tupleElement)
            // Otherwise, find a matching type from options in `allTypes` and use that to 
            // build the atoms. Only propagate an error if _all_ types options fail
            const tuple = allTypes.reduce(
                (acc: AlloyTuple | undefined, ele: AlloySignature[]): AlloyTuple|undefined => { 
                    if(acc) return acc
                    try {
                        return AlloyTuple.buildTuple(ele, tupleElement)
                    } catch(e) {
                        return undefined
                    }
                },
                undefined);
                
            if (!tuple) {
                throw AlloyError.error('AlloyField', 
                    `No match for tuple element ${tupleElement} in declared types ${allTypes}`);
            } else {
                return tuple
            }
        });
    } 

    private static buildTuple(types: AlloySignature[], tupleElement: Element): AlloyTuple { 
        //console.log(`In buildtuple; types: ${types}; tupleElement: ${tupleElement}`)
        const atoms = Array.from(tupleElement.querySelectorAll('atom')).map((atomElement, index) => {
            //console.log(`${index}: ${JSON.stringify(atomElement)}`)
            const type = types[index];
            const label = atomElement.getAttribute('label');
            if (!label) throw AlloyError.missingAttribute('AlloyField', 'label');                
            const atom = type.atom(label);
            if (!atom)
                throw AlloyError.error('AlloyField', `No atom: ${label} in type: ${type}`);                
            return atom;
        });        
        return new AlloyTuple(atoms);
}


}

/**
 * Index a list of tuples by the atom they each have in the given column.
 * Since AlloyAtoms should be canonical, this indexes by atom _name_, rather than object.
 */
function mapColumnToTuples (column: number, tuples: AlloyTuple[]): Map<string, AlloyTuple[]> {    

    const rTups = new Map<string, AlloyTuple[]>();
    tuples.forEach(tuple => {
        const atom = tuple.atoms()[column];
        if (!rTups.has(atom.id()))
            rTups.set(atom.id(), []);
        rTups.get(atom.id())!.push(tuple);        
    });    
    return rTups;

}

function removeDuplicateTuples (tuples: AlloyTuple[]): AlloyTuple[] {
    const set = new Set<string>();
    return tuples.filter(tuple => {
        const uid = tuple.atoms().map(atom => atom.id()).join();
        if (!set.has(uid)) {
            set.add(uid);
            return true;
        }
        return false;
    });
}

export {
    AlloySet,
    AlloyTuple
}

