import { AlloyTuple, tuplesFromElements } from './tuple';

export interface AlloyRelation {
  // identify as a relation
  _: 'relation';
  // the relation's unique identifier
  id: string;
  // the relation's name
  name: string;
  // the types that are allowed in the relation's tuples
  types: string[];
  // the relation's tuples
  tuples: AlloyTuple[];
}

export function getRelationTuples(relation: AlloyRelation): AlloyTuple[] {
  return relation.tuples;
}

export function relationFromElement(
  typeNames: Record<string, string>,
  element: Element
): AlloyRelation {
  const label = element.getAttribute('label');
  if (!label) throw new Error('No label found for field element');
  const types = typesFromTypesElement(typeNames, element);
  if (types.length === 0) throw new Error('No types found for field element');
  const parent = types[0];
  const tuples = tuplesFromElements(types, element.querySelectorAll('tuple'));
  return {
    _: 'relation',
    id: `${parent}<:${label}`,
    name: label,
    types,
    tuples
  };
}

export function relationsFromElements(
  typeNames: Record<string, string>,
  elements: NodeListOf<Element>
): AlloyRelation[] {
  return Array.from(elements).map((element) =>
    relationFromElement(typeNames, element)
  );
}

function typesFromTypesElement(
  typeNames: Record<string, string>,
  element: Element
): string[] {
  const typeElements = element.querySelectorAll('type');
  return Array.from(typeElements).map((typeElement) => {
    const typeId = typeElement.getAttribute('ID');
    if (!typeId) throw new Error('Type element must have an ID attribute');
    const typeName = typeNames[typeId];
    if (!typeName) throw new Error(`Type element with ID ${typeId} not found`);
    return typeName;
  });
}
