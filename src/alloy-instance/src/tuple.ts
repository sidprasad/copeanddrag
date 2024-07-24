import { atomFromElement, atomsFromElements } from './atom';

export interface AlloyTuple {
  // identify as a tuple
  _: 'tuple';
  // ordered array of atom ids that comprise the tuple
  atoms: string[];
  // ordered array of types that comprise the tuple
  types: string[];
}

export function tupleFromElement(types: string[], element: Element): AlloyTuple {
  return {
    _: 'tuple',
    types,
    atoms: Array
      .from(element.querySelectorAll('atom'))
      .map((atomElement, i) => atomFromElement(types[i], atomElement).id)
  }
}

export function tuplesFromElements(types: string[], elements: NodeListOf<Element>): AlloyTuple[] {
  return Array
    .from(elements)
    .map(element => tupleFromElement(types, element));
}

