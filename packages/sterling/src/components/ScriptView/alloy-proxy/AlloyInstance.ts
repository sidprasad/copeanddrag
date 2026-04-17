// import { CytoscapeOptions, EdgeDefinition, NodeDefinition } from 'cytoscape';
import { isDefined } from 'ts-is-present';
import { AlloyAtom } from './AlloyAtom';
import { AlloyError } from './AlloyError';
import { AlloyField } from './AlloyField';
import { AlloyProxy } from './AlloyProxy';
import { AlloySignature } from './AlloySignature';
import { AlloySkolem } from './AlloySkolem';

/**
 * In Alloy, when you run a predicate or check an assertion, the analyzer
 * searches for an _instance_ of an _analysis constraint_: an assignment of
 * values to the variables of the constraint for which the constraint evaluates
 * to true [[Jackson 2012](http://softwareabstractions.org/)].
 */
class AlloyInstance {
  private _proxy: AlloyProxy;

  private _atoms: AlloyAtom[];
  private _fields: AlloyField[];
  private _signatures: AlloySignature[];
  private _skolems: AlloySkolem[];

  private _projections: Map<AlloySignature, AlloyAtom>;

  private _bitwidth: number;
  private _command: string;
  private _filename: string;
  private _sources: Map<string, string>;

  /**
   * Create a new Alloy instance. If no text is provided, an empty instance
   * is created.
   * @param text A string containing the XML output from an Alloy instance
   * @param index
   */
  constructor(text?: string, index?: number) {
    this._proxy = new AlloyProxy();

    this._atoms = [];
    this._fields = [];
    this._signatures = [];
    this._skolems = [];

    this._projections = new Map();

    this._bitwidth = 0;
    this._command = '';
    this._filename = '';
    this._sources = new Map();

    if (text) this._buildFromXML(text, index);
  }

  /**
   * Get an atom by ID.
   * @param id The atom ID
   * @returns An atom or null if there is no atom with the specified ID
   */
  atom(id: string): AlloyAtom | null {
    return this._atoms.find((atom) => atom.id() === id) || null;
  }

  /**
   * Get an array of all atoms in the instance.
   */
  atoms(): AlloyAtom[] {
    return this._atoms.slice();
  }

  /**
   * Get the bitwidth of the instance.
   */
  bitwidth(): number {
    return this._bitwidth;
  }

  /**
   * Generate a deep clone of the instance.
   * @throws Error if the instance does not have a univ signature.
   */
  clone(): AlloyInstance {
    const proxy = new AlloyProxy();
    const univ = this.univ();

    if (!univ)
      throw AlloyError.error(
        'AlloyInstance',
        'Cannot clone an instance without univ signature'
      );

    const univClone = univ.clone(proxy);

    const signatures = [univClone, ...univClone.subSignatures(true)];
    const atoms = univClone.atoms(true);
    const fields = this.fields().map((field) => field.clone(signatures, proxy));
    const skolems = this.skolems().map((skolem) =>
      skolem.clone(signatures, proxy)
    );

    const instance = new AlloyInstance();

    instance._proxy = proxy;

    instance._fields = fields;
    instance._signatures = signatures;
    instance._atoms = atoms;
    instance._skolems = skolems;

    instance._bitwidth = this.bitwidth();
    instance._command = this.command();
    instance._filename = this.filename();

    return instance;
  }

  /**
   * Get the command used to generate the instance.
   */
  command(): string {
    return this._command;
  }

  /**
   * Get a field by ID.
   * @param id The field ID
   * @returns A field or null if there is no field with the specified ID
   */
  field(id: string): AlloyField | null {
    return this._fields.find((field) => field.id() === id) || null;
  }

  /**
   * Get an array of all fields in the instance.
   */
  fields(): AlloyField[] {
    return this._fields;
  }

  /**
   * Get the full path of the model used to generate the instance.
   */
  filename(): string {
    return this._filename;
  }

  /**
   * Project the instance over the specified atoms. There may be a maximum of
   * one atom per signature that is a direct descendant of the univ signature.
   * @param atoms The list of atoms over which to project the instance.
   * @returns A clone of the instance with the projection applied.
   * @throws Error if there is more than one atom provided for any signature
   * that is a direct descendant of the univ signature.
   */
  project(atoms: AlloyAtom[]): AlloyInstance {
    // Create clone and find same atoms
    const _instance = this.clone();
    const _atoms = atoms.map((atom) => _instance.atom(atom.id()));
    if (!_atoms.every(isDefined))
      throw AlloyError.error('AlloyInstance', 'Error cloning instance');

    // Make sure there's one atom per top-level signature
    const univ = _instance.univ();
    if (!univ) throw AlloyError.error('AlloyInstance', 'No univ signature');

    const allowableSigs = univ.subSignatures();
    const projections = new Map<AlloySignature, AlloyAtom>();
    _atoms.forEach((atom) => {
      allowableSigs.forEach((signature) => {
        if (signature.atoms(true).includes(atom!)) {
          if (projections.has(signature))
            throw AlloyError.error(
              'AlloyInstance',
              'Cannot project over multiple atoms from the same signature'
            );
          projections.set(signature, atom!);
        }
      });
    });

    // Do projection
    this._projections = projections;
    _instance.fields().forEach((field) => field.project(projections));
    _instance.skolems().forEach((skolem) => skolem.project(projections));
    return _instance;
  }

  /**
   * Get the currently projected atoms.
   * @returns A Map object with key-value pairs mapping signatures to projected atoms
   */
  projections(): Map<AlloySignature, AlloyAtom> {
    return new Map(this._projections);
  }

  /**
   * Get a signature by ID
   * @param id The signature ID
   * @returns A signature or null if there is no signature with the specified ID
   */
  signature(id: string): AlloySignature | null {
    return this.signatures().find((sig) => sig.id() === id) || null;
  }

  /**
   * Get an array of all signatures in the instance.
   */
  signatures(): AlloySignature[] {
    return this._signatures.slice();
  }

  /**
   * Get a skolem by ID
   * @param id The skolem ID
   * @returns A skolem or null if there is no skolem with the specified ID
   */
  skolem(id: string): AlloySkolem | null {
    return this.skolems().find((skolem) => skolem.id() === id) || null;
  }

  /**
   * Get an array of all skolems in the instance.
   */
  skolems(): AlloySkolem[] {
    return this._skolems.slice();
  }

  /**
   * Get all source files that define the model from which this instance was created.
   * @returns A Map object with key-value pairs mapping full path names to file contents
   */
  sources(): Map<string, string> {
    return new Map(this._sources);
  }

  // toCytoscape (compound: boolean = false): CytoscapeOptions {
  //
  //     const connected = new Set<string>();
  //
  //     this.fields().forEach(field => {
  //         field.tuples().forEach(tuple => {
  //             tuple.atoms().forEach(atom => {
  //                 connected.add(atom.id());
  //             });
  //         });
  //     });
  //
  //     let nodes: NodeDefinition[] = [];
  //
  //     if (compound) {
  //
  //         const univ = this.univ();
  //         if (univ) tonode(univ);
  //
  //     } else {
  //
  //         nodes = this.atoms()
  //             .filter(atom => connected.has(atom.id()))
  //             .map(atom => {
  //                 return  {
  //                     data: {
  //                         id: atom.id()
  //                     }
  //                 };
  //             });
  //
  //     }
  //
  //     const edges: EdgeDefinition[] = this.fields().map(field => {
  //         return field.tuples().map(tuple => {
  //             const atoms = tuple.atoms();
  //             const first = atoms[0];
  //             const last = atoms[atoms.length - 1];
  //             const middle = atoms.slice(1, -1);
  //             return {
  //                 data: {
  //                     id: field.id() + tuple.toString(),
  //                     source: first.id(),
  //                     target: last.id(),
  //                     label: field.id() + (middle.length
  //                         ? `[${middle.map(atom => atom.id()).join(',')}]`
  //                         : '')
  //                 }
  //             }
  //         });
  //     }).reduce((acc, cur) => acc.concat(cur), []);
  //
  //     return {
  //         elements: {
  //             nodes: nodes,
  //             edges: edges
  //         },
  //         style: [
  //             {
  //                 selector: 'node',
  //                 style: {
  //                     label: 'data(id)'
  //                 }
  //             },
  //             {
  //                 selector: 'edge',
  //                 style: {
  //                     'label': 'data(label)',
  //                     'curve-style': 'bezier',
  //                     'target-arrow-shape': 'triangle'
  //                 }
  //             }
  //         ]
  //     };
  //
  //     function tonode (signature: AlloySignature, parent?: AlloySignature) {
  //
  //         const include = signature.atoms(true).some(atom => connected.has(atom.id()));
  //
  //         if (include) {
  //
  //             nodes.push({
  //                 data: {
  //                     id: signature.id(),
  //                     parent: parent ? parent.id() : undefined
  //                 }
  //             });
  //
  //             signature.atoms()
  //                 .filter(atom => connected.has(atom.id()))
  //                 .forEach(atom => {
  //                     nodes.push({
  //                         data: {
  //                             id: atom.id(),
  //                             parent: signature.id()
  //                         }
  //                     });
  //                 });
  //
  //             signature.subSignatures().forEach(sig => tonode(sig, signature));
  //
  //         }
  //
  //     }
  //
  // }

  /**
   * Get the univ signature.
   * @returns The univ signature if it exists, null if it does not
   */
  univ(): AlloySignature | null {
    return this._signatures.find((sig) => sig.id() === 'univ') || null;
  }

  private _buildFromXML(text: string, index?: number): void {
    const parser = new DOMParser();
    const document = parser.parseFromString(text, 'application/xml');
    const instances = document.querySelectorAll('instance');
    const instance = index !== undefined ? instances[index] : instances[0];

    if (!instance) throw AlloyError.missingElement('AlloyInstance', 'instance');

    const bw = instance.getAttribute('bitwidth');
    const cd = instance.getAttribute('command');
    const fn = instance.getAttribute('filename');
    const ms = instance.getAttribute('maxseq');

    if (!bw) throw AlloyError.missingAttribute('AlloyInstance', 'bitwidth');
    if (!cd) throw AlloyError.missingAttribute('AlloyInstance', 'command');
    if (!fn) throw AlloyError.missingAttribute('AlloyInstance', 'filename');
    if (!ms) throw AlloyError.missingAttribute('AlloyInstance', 'maxseq');
    if (+bw < 1)
      throw AlloyError.error('AlloyInstance', `Invalid bitwidth ${bw}`);

    this._bitwidth = +bw;
    this._command = cd;
    this._filename = fn;

    this._atoms = [];
    this._fields = [];
    this._signatures = [];
    this._skolems = [];

    const sigIDs = AlloySignature.signaturesFromXML(instance, this._proxy);

    this._signatures = Array.from(sigIDs.values());
    this._fields = AlloyField.fieldsFromXML(instance, sigIDs, this._proxy);
    this._skolems = AlloySkolem.skolemsFromXML(instance, sigIDs, this._proxy);
    this._atoms = this._signatures
      .map((sig) => sig.atoms())
      .reduce((acc, cur) => acc.concat(cur), []);

    this._sources = new Map();
    Array.from(document.querySelectorAll('source')).forEach((element) => {
      const filename = element.getAttribute('filename');
      const source = element.getAttribute('content');
      if (!filename)
        throw AlloyError.missingAttribute('AlloyInstance', 'filename');
      if (!source)
        throw AlloyError.missingAttribute('AlloyInstance', 'content');
      this._sources.set(filename, source);
    });
  }
}

export { AlloyInstance };
