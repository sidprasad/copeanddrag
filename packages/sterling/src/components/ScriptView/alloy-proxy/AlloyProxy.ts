import { AlloyError } from './AlloyError';
import { AlloySet } from './AlloySet';

class AlloyProxy {

    private readonly _sets: Map<string, AlloySet>;

    constructor () {
        this._sets = new Map();
    }

    /**
     * Construct a proxy object that wraps an AlloySet, and provides some syntactic-sugar 
     * (e.g., for join) via JavaScript's built-in methods. 
     * @param set the AlloySet object to proxy
     * @param id the name of the set     
     */
    applyProxy<T extends AlloySet> (set: T, id?: string): T {

        const _sets = this._sets;
        const _id: string = id || `${_sets.size}`;
        const _finalize = this._finalize.bind(this);

        if (_sets.has(_id))
            throw AlloyError.error('AlloyProxy', 
              `Cannot apply proxy, ID already exists: ${_id}. (This may be caused by a clash between sig and atom names.)`);

        const proxy = new Proxy<T>(set, {

            /**
             * Override getting a property value to allow use of "a.b" in place of "a.join(b)"
             * and "b[a]" in place of "a.join(b)". This follows the Proxy<T> interface.
             */
            get (target: T, prop: string | number | symbol): any {
                if (typeof prop === 'symbol' || prop in target) {
                    // If this is an actual field of the object, just use it.
                    return Reflect.get(target, prop);

                } else if (typeof prop === 'number' || !isNaN(+prop)) {
                    // If this is a number, the user is likely trying to join an integer atom
                    const left = _sets.get(`${prop}`);
                    if (!left) throw AlloyError.error('Join', `Integer atom does not exist: ${prop}`);
                    return _finalize(left.join(target));

                } else {
                    // Otherwise, the user is likely trying to join a relation. 
                    let join: AlloySet;
                    const match = prop.match(/\[(.*)]/);

                    if (match) {
                        // box join
                        const left = _sets.get(match[1]);
                        if (!left) throw AlloyError.error('Box Join', `Tried to join ${id} with ${match[1]} but no set ${match[1]} defined.`, true);
                        join = left.join(target);
                    } else {
                        // dot join
                        const right = _sets.get(prop);
                        if (!right) throw AlloyError.error('Dot Join', `Tried to join ${id} with ${prop} but no set ${prop} defined.`, true);
                        join = target.join(right);
                    }

                    return _finalize(join);

                }

            }

        });

        Reflect.set(proxy, Symbol.toPrimitive, () => `[${_id}]`);
        Reflect.set(proxy, '__var__', _id);

        this._sets.set(_id, proxy);

        return proxy;

    }

    private _finalize (set: AlloySet): AlloySet {

        if (set.tuples().length === 1 && set.tuples()[0].atoms().length === 1) {
            const atom = set.tuples()[0].atoms()[0];
            return this._sets.get(atom.id()) || this.applyProxy(atom, atom.id());
        }

        return this.applyProxy(set);

    }

}

export {
    AlloyProxy
}
