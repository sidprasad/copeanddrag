import { AlloyInstance, getInstanceAtom, getInstanceType } from './instance';
import { AlloyType, isBuiltin } from './type';
import { JSDOM } from 'jsdom';

export interface AlloyAtom {
  // identify as an atom
  _: 'atom';
  // the atom's unique id
  id: string;
  // the atom's type
  type: string;
}

/**
 * Create an atom from an Element.
 *
 * This function is typically used to create atoms from DOM elements, such as
 * when parsing an Alloy XML file.
 *
 * @param type The type of the atom.
 * @param element The element to create the atom from.
 */
export function atomFromElement(type: string, element: Element): AlloyAtom {
  const id = element.getAttribute('label');
  if (!id) throw new Error('No label attribute in atom element');
  return {
    _: 'atom',
    id,
    type
  };
}

/**
 * Create an array of atoms from a NodeListOf of Elements.
 *
 * This function is typically used to create atoms from DOM elements, such as
 * when parsing an Alloy XML file.
 *
 * @param type The type of all of the atoms.
 * @param elements The elements to create the atoms from.
 */
export function atomsFromElements(
  type: string,
  elements: NodeListOf<Element>
): AlloyAtom[] {
  return Array.from(elements).map((element) => atomFromElement(type, element));
}

/**
 * Determine if an atom is of a builtin type.
 *
 * @param instance The instance the atom is part of
 * @param atom The atom or atom id
 */
export function atomIsBuiltin(
  instance: AlloyInstance,
  atom: AlloyAtom | string
): boolean {
  if (typeof atom === 'string') atom = getInstanceAtom(instance, atom);
  const atomType = getAtomType(instance, atom);
  const atomTypeHierarchy = atomType.types;
  return atomTypeHierarchy
    .map((typeId) => getInstanceType(instance, typeId))
    .some(isBuiltin);
}

export function atomIsOfType(
  instance: AlloyInstance,
  atom: AlloyAtom | string,
  type: AlloyType | string
): boolean {
  if (typeof atom === 'string') atom = getInstanceAtom(instance, atom);
  if (typeof type !== 'string') type = type.id;
  const atomType = getAtomType(instance, atom);
  const atomTypeHierarchy = atomType.types;
  return atomTypeHierarchy.includes(type);
}

export function buildIntAtoms(bitwidth: number): AlloyAtom[] {
  const atoms: AlloyAtom[] = [];
  const n = Math.pow(2, bitwidth);
  for (let i = -n / 2; i < n / 2; ++i) {
    atoms.push({
      _: 'atom',
      id: i.toString(),
      type: 'Int'
    });
  }
  return atoms;
}

/**
 * Get the type of on an atom.
 * @param instance The instance the atom comes from.
 * @param atom The atom to get the type of.
 * @return The type of the atom.
 */
export function getAtomType(
  instance: AlloyInstance,
  atom: AlloyAtom | string
): AlloyType {
  if (typeof atom === 'string') atom = getInstanceAtom(instance, atom);
  const type = instance.types[atom.type];
  if (!type)
    throw new Error(
      `The atom's type is not part of the instance: ${atom.type}`
    );
  return instance.types[atom.type];
}

/**
 * Get the id of the type of an atom.
 * @param instance The instance the atom comes from.
 * @param atom The atom or id of the atom to get the type of.
 * @return The id of the type of the atom.
 */
export function getTypeId(
  instance: AlloyInstance,
  atom: AlloyAtom | string
): string {
  return getAtomType(instance, atom).id;
}
