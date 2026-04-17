import { ScriptVariable } from '../../state/script/script';

const alloyDefs: string = `
class AlloyError {
  static error(source: string, message: string): Error;

  static missingAttribute(source: string, attribute: string): Error;

  static missingElement(source: string, element: string): Error;
}

class AlloySignature extends AlloySet {
  private readonly _id;
  private readonly _atoms;
  private _subsignatures;

  /**
   * Create a new Alloy signature.
   *
   * @param id The signature's unique ID
   * @param atoms The atoms defined by the signature
   * @param proxy If provided, a proxied signature will be created.
   */
  constructor(id: string, atoms: AlloyAtom[], proxy?: AlloyProxy);

  /**
   * Get an atom by ID
   * @param id The atom ID
   * @returns An atom or null if there is no atom with the specified ID
   */
  atom(id: string): AlloyAtom | null;

  /**
   * Get an array of all atoms in this signature.
   * @param recursive If false, return only atoms defined by this signature,
   * if true, include atoms defined by all subsignatures as well.
   */
  atoms(recursive?: boolean): AlloyAtom[];

  /**
   * Create a clone of this signature.
   * @param proxy If provided, a proxied clone will be returned.
   */
  clone(proxy?: AlloyProxy): AlloySignature;

  /**
   * Get the signature ID.
   */
  id(): string;

  /**
   * Get an array of all signatures that extend this signature.
   * @param recursive If false, return only signatures that are immediate
   * children of this signature. If true, return all signatures that are
   * descendants of this signature.
   */
  subSignatures(recursive?: boolean): AlloySignature[];

  /**
   * Create a signature from an XML element and populate the signature with
   * atoms. Any signatures that extend the one defined in the element are not
   * created.
   *
   * @param element The XML \`\`\`<sig>\`\`\` element
   * @param proxy If provided, a proxied signature with proxied atoms will be
   * returned.
   */
  static fromElement(element: Element, proxy?: AlloyProxy): AlloySignature;

  /**
   * Create the Int signature.
   *
   * @param bitwidth The integer bitwidth, which must be greater than or equal to zero.
   * @param proxy If provided, a proxied Int signature with proxied atoms will
   * be returned.
   */
  static intSignature(bitwidth: number, proxy?: AlloyProxy): AlloySignature;

  /**
   * TODO: Check and document this.
   * @param intsig
   * @param proxy
   */
  static seqIntSignature(
    intsig: AlloySignature,
    proxy?: AlloyProxy
  ): AlloySignature;

  /**
   * Build all signatures from an XML \`\`\`<instance>\`\`\` element. All signatures are
   * populated with atoms.
   *
   * @param instance The XML \`\`\`<instance>\`\`\` element
   * @param proxy If provided, all signatures and atoms will be proxied.
   * @returns A map of string IDs, as defined by the "ID" attribute for each
   * signature, to [[AlloySignature]] objects.
   */
  static signaturesFromXML(
    instance: Element,
    proxy?: AlloyProxy
  ): Map<string, AlloySignature>;

  /**
   * Get an array of signature types associated with an XML element. Typically
   * this is used when parsing a field or skolem, as each \`\`\`<field>\`\`\` and \`\`\`<skolem>\`\`\`
   * element will have a \`\`\`<types>\`\`\` child. This method parses the types defined
   * in this element and returns the corresponding signatures.
   *
   * @param element The XML element that has a <types> child
   * @param sigIDs A map of signature IDs to signatures
   */
  static typesFromXML(
    element: Element,
    sigIDs: Map<string, AlloySignature>
  ): AlloySignature[];
}

class AlloySet {
  protected _tuples: AlloyTuple[];

  /**
   * Create a new Alloy set.
   *
   * @param tuples The tuples contained in the set
   */
  constructor(tuples?: AlloyTuple[]);

  /**
   * Returns true if the set is empty, false if it is not.
   */
  empty(): boolean;

  /**
   * Returns true if this set is equivalent to the provided set, false otherwise.
   * @param that The set to compare to
   */
  equals(that: AlloySet): boolean;

  /**
   * Returns true if this set is a subset of the provided set, false otherwise.
   * @param that The set to compare to
   */
  in(that: AlloySet): boolean;

  /**
   * Perform a join operation with another set. This operation is equivalent
   * to the dot join operator in Alloy, in which this set is on the left side
   * of the dot and that set is on the right side.
   *
   * @param that The other set
   */
  join(that: AlloySet): AlloySet;

  /**
   * Create a printable string representation of this set.
   */
  toString(): string;

  /**
   * Get an array of all tuples in this set.
   */
  tuples(): AlloyTuple[];
}

class AlloyTuple extends AlloySet {
  private _atoms;

  /**
   * Create a new Alloy tuple.
   *
   * @param atoms The atoms, in order, that comprise the tuple.
   */
  constructor(atoms: AlloyAtom[]);

  /**
   * Get an ordered list of the atoms in this tuple.
   */
  atoms(): AlloyAtom[];

  /**
   * Create a printable string representation of this tuple.
   */
  toString(): string;

  /**
   * Create an array of tuples from a node list of \`\`\`<tuple>\`\`\` XML elements.
   *
   * @param elements A node list of \`\`\`<tuple>\`\`\` elements, typically created
   * using the \`\`\`querySelectorAll()\`\`\` method on a \`\`\`<field>\`\`\` or
   * \`\`\`<skolem>\`\`\` element.
   * @param types An ordered array of signatures that define the type of each
   * atom in each tuple, typically created using [[AlloySignature.typesFromXML]].
   */
  static tuplesFromXML(
    elements: NodeListOf<Element>,
    types: AlloySignature[]
  ): AlloyTuple[];
}

class AlloyProxy {
  private readonly _sets;

  constructor();

  applyProxy<T extends AlloySet>(set: T, id?: string): T;

  private _finalize;
}

/**
 * In Alloy, an atom is a primitive entity that is indivisible, immutable, and
 * uninterpreted.
 */
class AlloyAtom extends AlloySet {
  private readonly _id;

  constructor(id: string, proxy?: AlloyProxy);

  clone(proxy?: AlloyProxy): AlloyAtom;

  id(): string;

  static fromElement(element: Element, proxy?: AlloyProxy): AlloyAtom;
}

class AlloyTypedSet extends AlloySet {
  private readonly _types;

  constructor(types: AlloySignature[], tuples: AlloyTuple[]);

  project(atoms: Map<AlloySignature, AlloyAtom>): void;

  types(): AlloySignature[];
}

export class AlloyField extends AlloyTypedSet {
  private readonly _id;

  /**
   * Create a new Alloy field.
   * @param id The field's unique ID
   * @param types An array of signatures defining the types of each column of the field
   * @param tuples The tuples defined by the field
   * @param proxy If provided, a proxied signature will be created.
   * @param varName If provided, the variable name to assign to this field when proxied.
   */
  constructor(
    id: string,
    types: AlloySignature[],
    tuples: AlloyTuple[],
    proxy?: AlloyProxy,
    varName?: string
  );

  /**
   * Create a clone of this field
   *
   * @param signatures An array of signatures. When creating the clone of this
   * field, the types associated with each column are not cloned. Instead,
   * provide an array of signatures and this method will find the corresponding
   * types by signature ID in the array and use them to define types of the
   * cloned field.
   * @param proxy If provided, a proxied clone will be returned.
   */
  clone(signatures: AlloySignature[], proxy?: AlloyProxy): AlloyField;

  /**
   * Get the field ID.
   */
  id(): string;

  /**
   * Build all fields from an XML \`\`\`<instance>\`\`\` element. All fields are
   * fully populated with tuples.
   *
   * @param instance The XML \`\`\`<instance>\`\`\` element
   * @param sigIDs A map of signature string IDs to signature objects
   * @param proxy If provided, all fields will be proxied.
   */
  static fieldsFromXML(
    instance: Element,
    sigIDs: Map<string, AlloySignature>,
    proxy?: AlloyProxy
  ): AlloyField[];
}

class AlloySkolem extends AlloyTypedSet {
  private readonly _id;

  constructor(
    id: string,
    types: AlloySignature[],
    tuples: AlloyTuple[],
    proxy?: AlloyProxy
  );

  clone(signatures: AlloySignature[], proxy?: AlloyProxy): AlloySkolem;

  id(): string;

  static skolemsFromXML(
    instance: Element,
    sigIDs: Map<string, AlloySignature>,
    proxy?: AlloyProxy
  ): AlloySkolem[];
}

/**
 * In Alloy, when you run a predicate or check an assertion, the analyzer
 * searches for an _instance_ of an _analysis constraint_: an assignment of
 * values to the variables of the constraint for which the constraint evaluates
 * to true [[Jackson 2012](http://softwareabstractions.org/)].
 */
class AlloyInstance {
  private _proxy;
  private _atoms;
  private _fields;
  private _signatures;
  private _skolems;
  private _projections;
  private _bitwidth;
  private _command;
  private _filename;
  private _sources;

  /**
   * Create a new Alloy instance. If no text is provided, an empty instance
   * is created.
   * @param text A string containing the XML output from an Alloy instance
   * @param index
   */
  constructor(text?: string, index?: number);

  /**
   * Get an atom by ID.
   * @param id The atom ID
   * @returns An atom or null if there is no atom with the specified ID
   */
  atom(id: string): AlloyAtom | null;

  /**
   * Get an array of all atoms in the instance.
   */
  atoms(): AlloyAtom[];

  /**
   * Get the bitwidth of the instance.
   */
  bitwidth(): number;

  /**
   * Generate a deep clone of the instance.
   * @throws Error if the instance does not have a univ signature.
   */
  clone(): AlloyInstance;

  /**
   * Get the command used to generate the instance.
   */
  command(): string;

  /**
   * Get a field by ID.
   * @param id The field ID
   * @returns A field or null if there is no field with the specified ID
   */
  field(id: string): AlloyField | null;

  /**
   * Get an array of all fields in the instance.
   */
  fields(): AlloyField[];

  /**
   * Get the full path of the model used to generate the instance.
   */
  filename(): string;

  /**
   * Project the instance over the specified atoms. There may be a maximum of
   * one atom per signature that is a direct descendant of the univ signature.
   * @param atoms The list of atoms over which to project the instance.
   * @returns A clone of the instance with the projection applied.
   * @throws Error if there is more than one atom provided for any signature
   * that is a direct descendant of the univ signature.
   */
  project(atoms: AlloyAtom[]): AlloyInstance;

  /**
   * Get the currently projected atoms.
   * @returns A Map object with key-value pairs mapping signatures to projected atoms
   */
  projections(): Map<AlloySignature, AlloyAtom>;

  /**
   * Get a signature by ID
   * @param id The signature ID
   * @returns A signature or null if there is no signature with the specified ID
   */
  signature(id: string): AlloySignature | null;

  /**
   * Get an array of all signatures in the instance.
   */
  signatures(): AlloySignature[];

  /**
   * Get a skolem by ID
   * @param id The skolem ID
   * @returns A skolem or null if there is no skolem with the specified ID
   */
  skolem(id: string): AlloySkolem | null;

  /**
   * Get an array of all skolems in the instance.
   */
  skolems(): AlloySkolem[];

  /**
   * Get all source files that define the model from which this instance was created.
   * @returns A Map object with key-value pairs mapping full path names to file contents
   */
  sources(): Map<string, string>;

  /**
   * Get the univ signature.
   * @returns The univ signature if it exists, null if it does not
   */
  univ(): AlloySignature | null;

  private _buildFromXML;
}`;

function generateAlloyVariablesModel(variables: ScriptVariable[]): string {
  return variables
    .map((variable) => {
      return `declare const ${variable.name}: ${variable.type};`;
    })
    .join('\n');
}

export { alloyDefs, generateAlloyVariablesModel };
