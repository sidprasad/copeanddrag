import { AlloyAtom, atomsFromElements, buildIntAtoms } from './atom';
import { AlloyInstance, getInstanceType } from './instance';
import { isDefined } from './util';
import { sigElementIsSet } from './xml';

export interface AlloyType {
  // identify as a type
  _: 'type';
  // the type's unique id
  id: string;
  // the type hierarchy as an array of type ids, in ascending order
  types: string[];
  // the atoms defined by the type
  atoms: AlloyAtom[];
  // flags describing the type
  meta?: TypeMeta;
}

interface TypeMeta {
  abstract?: boolean;
  builtin?: boolean;
  enum?: boolean;
  meta?: boolean;
  one?: boolean;
  private?: boolean;
}

export function findAndPopulateIntType(bitwidth: number, types: AlloyType[]) {
  const intType = types.find((t) => t.id === 'Int');
  if (!intType) throw new Error('Could not find Int type');
  intType.atoms = buildIntAtoms(bitwidth);
}

export function getTopLevelTypeId(type: AlloyType): string {
  return type.types[type.types.length - 1];
}

export function getTypeAtoms(type: AlloyType): AlloyAtom[] {
  return type.atoms;
}

export function isAbstract(type: AlloyType): boolean {
  return type.meta !== undefined && type.meta.abstract === true;
}

export function isBuiltin(type: AlloyType): boolean {
  return type.meta !== undefined && type.meta.builtin === true;
}

export function isEnum(type: AlloyType): boolean {
  return type.meta !== undefined && type.meta.enum === true;
}

export function isMeta(type: AlloyType): boolean {
  return type.meta !== undefined && type.meta.meta === true;
}

export function isOne(type: AlloyType): boolean {
  return type.meta !== undefined && type.meta.one === true;
}

export function isPrivate(type: AlloyType): boolean {
  return type.meta !== undefined && type.meta.private === true;
}

export function typeFromElement(
  typeHierarchies: Record<string, string[]>,
  element: Element
): AlloyType {
  const id = element.getAttribute('label');
  if (!id) throw new Error('No label attribute in sig element');
  const types = typeHierarchies[id];
  if (!types) {
    console.log(typeHierarchies);
    throw new Error(`No type hierarchy for ${id}`);
  }
  const meta = typeMetaFromElement(element);
  const type: AlloyType = {
    _: 'type',
    id,
    types,
    atoms: atomsFromElements(id, element.querySelectorAll('atom')),
    meta: undefined
  };
  if (isDefined(meta)) type.meta = meta;
  return type;
}

export function typesFromElements(
  typeHierarchies: Record<string, string[]>,
  elements: NodeListOf<Element>
): AlloyType[] {
  return Array.from(elements)
    .filter((element) => !sigElementIsSet(element))
    .map((element) => typeFromElement(typeHierarchies, element));
}

export function typeIsOfType(
  instance: AlloyInstance,
  type: AlloyType | string,
  isOfType: AlloyType | string
): boolean {
  if (typeof type === 'string') type = getInstanceType(instance, type);
  if (typeof isOfType !== 'string') isOfType = isOfType.id;
  return type.types.includes(isOfType);
}

function typeMetaFromElement(element: Element): TypeMeta | undefined {
  const meta: TypeMeta = {};
  if (element.getAttribute('abstract') === 'yes') meta.abstract = true;
  if (element.getAttribute('builtin') === 'yes') meta.builtin = true;
  if (element.getAttribute('enum') === 'yes') meta.enum = true;
  if (element.getAttribute('meta') === 'yes') meta.meta = true;
  if (element.getAttribute('one') === 'yes') meta.one = true;
  if (element.getAttribute('private') === 'yes') meta.private = true;
  return Object.keys(meta).length === 0 ? undefined : meta;
}
