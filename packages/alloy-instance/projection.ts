import {
  AlloyInstance,
  AlloyRelation,
  AlloyTuple,
  AlloyType,
  getAtomType,
  getInstanceTypes,
  getTopLevelTypeId,
  typeIsOfType
} from 'spytial-core/alloy-instance';

// Alloy projection, owned here since spytial-core 6.0.0 dropped its projection helpers:
// the engine lays out whatever instance it is handed, so projecting is the host's job.
// Ported from spytial-core 5.x (src/data-instance/alloy/alloy-instance/src/projection.ts).

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
  const uniqueTypes = [...new Set(getInstanceTypes(instance).map(getTopLevelTypeId))];
  return uniqueTypes.filter((type) => type !== undefined);
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

    if (!isProjected) {
      relations[relationId] = relation;
      continue;
    }

    const projectedIndices = getProjectedTypeIndices(
      instance,
      relation.types,
      projectedTypes
    );
    relations[relationId] = {
      _: 'relation',
      id: relation.id,
      name: relation.name,
      types: removeIndices(relation.types, projectedIndices),
      tuples: projectTuples(relation.tuples, projectedIndices, projectedAtoms)
    };
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
