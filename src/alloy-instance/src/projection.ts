import { isUndefined, uniq } from 'lodash';
import { getAtomType } from './atom';
import { AlloyInstance, getInstanceTypes } from './instance';
import { AlloyRelation } from './relation';
import { AlloyTuple } from './tuple';
import { AlloyType, getTopLevelTypeId, typeIsOfType } from './type';

export function applyProjections(
  instance: AlloyInstance,
  atomIds: string[]
): AlloyInstance {
  const projections: Record<string, string> = {};

  atomIds.forEach((atomId) => {
    const type = getAtomType(instance, atomId);
    const topType = getTopLevelTypeId(type);
    if (!projections[topType]) {
      projections[topType] = atomId;
    } else {
      throw new Error(
        `Cannot project ${atomId} and ${projections[topType]}. Both are of type ${topType}`
      );
    }
  });

  return {
    types: projectTypes(instance, projections),
    relations: projectRelations(instance, projections),
    skolems: instance.skolems
  };
}

export function getProjectableTypes(instance: AlloyInstance): string[] {
  return uniq(getInstanceTypes(instance).map(getTopLevelTypeId)).filter(
    (type) => !isUndefined(type)
  );
}

function projectTypes(
  instance: AlloyInstance,
  projections: Record<string, string>
): Record<string, AlloyType> {
  const types: Record<string, AlloyType> = {};
  const projectedTypes = Object.keys(projections);

  for (const typeId in instance.types) {
    const type = instance.types[typeId];
    const isProjected = projectedTypes.some((projectedType) =>
      typeIsOfType(instance, type, projectedType)
    );
    types[typeId] = {
      _: 'type',
      id: type.id,
      types: type.types,
      atoms: isProjected ? [] : type.atoms,
      meta: type.meta
    };
  }

  return types;
}

function projectRelations(
  instance: AlloyInstance,
  projections: Record<string, string>
): Record<string, AlloyRelation> {
  const relations: Record<string, AlloyRelation> = {};
  const projectedTypes = Object.keys(projections);
  const projectedAtoms = Object.values(projections);

  for (const relationId in instance.relations) {
    const relation = instance.relations[relationId];
    const isProjected = relation.types.some((relationType) =>
      projectedTypes.some((projectedType) =>
        typeIsOfType(instance, relationType, projectedType)
      )
    );

    const projectedIndices = isProjected
      ? getProjectedTypeIndices(instance, relation.types, projectedTypes)
      : [];
    relations[relationId] = {
      _: 'relation',
      id: relation.id,
      name: relation.name,
      types: isProjected
        ? removeIndices(relation.types, projectedIndices)
        : relation.types,
      tuples: isProjected
        ? projectTuples(relation.tuples, projectedIndices, projectedAtoms)
        : relation.tuples
    };
    if (isProjected) {
    } else {
      relations[relationId] = relation;
    }
  }

  return relations;
}

function getProjectedTypeIndices(
  instance: AlloyInstance,
  types: string[],
  projectedTypes: string[]
): number[] {
  const indices: number[] = [];
  types.forEach((type, index) => {
    if (
      projectedTypes.some((projectedType) =>
        typeIsOfType(instance, type, projectedType)
      )
    ) {
      indices.push(index);
    }
  });
  return indices;
}

function projectTuples(
  tuples: AlloyTuple[],
  projectedIndices: number[],
  projectedAtoms: string[]
): AlloyTuple[] {
  return tuples
    .filter((tuple) =>
      tuple.atoms.some((atom) => projectedAtoms.includes(atom))
    )
    .map((tuple): AlloyTuple => {
      return {
        _: 'tuple',
        types: removeIndices(tuple.types, projectedIndices),
        atoms: removeIndices(tuple.atoms, projectedIndices)
      };
    })
    .filter((tuple) => tuple.atoms.length > 1);
}

function removeIndices<T>(array: T[], indices: number[]): T[] {
  const result: T[] = [];
  for (let i = 0; i < array.length; i++) {
    if (!indices.includes(i)) {
      result.push(array[i]);
    }
  }
  return result;
}
