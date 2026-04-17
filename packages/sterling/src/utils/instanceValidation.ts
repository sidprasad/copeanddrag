import { AlloyInstance, AlloyType, AlloyRelation } from '@/alloy-instance';

export type IssueSeverity = 'error' | 'warning';

export type IssueType =
  | 'arity'
  | 'type-mismatch'
  | 'multiplicity'
  | 'orphan-atom';

export interface ValidationIssue {
  type: IssueType;
  severity: IssueSeverity;
  message: string;
}

export interface ValidationResult {
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  isValid: boolean;
}

/**
 * IDataInstance interface matching spytial-core's runtime shape.
 * Accessed via graphElement.dataInstance in EditView.
 */
interface IDataInstance {
  getTypes(): { id: string; atoms: { id: string; type?: string }[] }[];
  getRelations(): {
    id: string;
    name: string;
    types: string[];
    tuples: { atoms: string[] }[];
  }[];
  getAtoms(): { id: string; type?: string }[];
}

const BUILTIN_TYPES = new Set(['Int', 'String', 'univ', 'seq/Int']);

/**
 * Build a map from each type ID to the set of all ancestor type IDs (including itself).
 * AlloyType.types is the hierarchy in ascending order, e.g. ['Dog', 'Animal', 'univ'].
 */
function buildTypeCompatibilityMap(
  schema: AlloyInstance
): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const type of Object.values(schema.types)) {
    map.set(type.id, new Set(type.types));
  }
  return map;
}

/**
 * Build a reverse map: for a given type, what concrete types are subtypes of it?
 */
function buildSubtypeMap(schema: AlloyInstance): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const type of Object.values(schema.types)) {
    // type.types is the hierarchy: [self, parent, grandparent, ..., univ]
    // So for each ancestor, this type is a subtype
    for (const ancestor of type.types) {
      if (!map.has(ancestor)) map.set(ancestor, new Set());
      map.get(ancestor)!.add(type.id);
    }
  }
  return map;
}

/**
 * Resolve the type of an atom from the edited instance.
 * Tries the atom's .type property first, then falls back to finding it in the types list.
 */
function resolveAtomType(
  atomId: string,
  dataInstance: IDataInstance
): string | undefined {
  const atoms = dataInstance.getAtoms();
  const atom = atoms.find((a) => a.id === atomId);
  if (atom?.type) return atom.type;

  // Fallback: find which type owns this atom
  for (const type of dataInstance.getTypes()) {
    if (type.atoms.some((a) => a.id === atomId)) {
      return type.id;
    }
  }
  return undefined;
}

function checkArities(
  dataInstance: IDataInstance,
  schema: AlloyInstance
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const schemaRelations = schema.relations;

  for (const rel of dataInstance.getRelations()) {
    // Find matching schema relation by id
    const schemaRel: AlloyRelation | undefined = schemaRelations[rel.id];
    const expectedArity = schemaRel ? schemaRel.types.length : rel.types.length;

    for (const tuple of rel.tuples) {
      if (tuple.atoms.length !== expectedArity) {
        issues.push({
          type: 'arity',
          severity: 'error',
          message: `Relation "${rel.name}" expects arity ${expectedArity} but found tuple with ${tuple.atoms.length} atoms: [${tuple.atoms.join(', ')}]`,
        });
      }
    }
  }
  return issues;
}

function checkTyping(
  dataInstance: IDataInstance,
  schema: AlloyInstance,
  compatMap: Map<string, Set<string>>,
  subtypeMap: Map<string, Set<string>>
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const schemaRelations = schema.relations;

  for (const rel of dataInstance.getRelations()) {
    const schemaRel: AlloyRelation | undefined = schemaRelations[rel.id];
    if (!schemaRel) continue; // Can't type-check relations not in original schema

    for (const tuple of rel.tuples) {
      for (let i = 0; i < tuple.atoms.length && i < schemaRel.types.length; i++) {
        const expectedType = schemaRel.types[i];
        if (BUILTIN_TYPES.has(expectedType)) continue;

        const atomType = resolveAtomType(tuple.atoms[i], dataInstance);
        if (!atomType) continue; // Can't resolve atom type, skip

        // Check: is atomType a subtype of expectedType?
        const ancestors = compatMap.get(atomType);
        if (ancestors && ancestors.has(expectedType)) continue; // Compatible

        // Also check if the atom type itself is in the subtypes of expectedType
        const subtypes = subtypeMap.get(expectedType);
        if (subtypes && subtypes.has(atomType)) continue; // Compatible

        issues.push({
          type: 'type-mismatch',
          severity: 'error',
          message: `Relation "${rel.name}" column ${i + 1} expects type "${expectedType}" but atom "${tuple.atoms[i]}" is of type "${atomType}"`,
        });
      }
    }
  }
  return issues;
}

function checkMultiplicities(
  dataInstance: IDataInstance,
  schema: AlloyInstance
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const editedTypes = dataInstance.getTypes();

  for (const schemaType of Object.values(schema.types)) {
    if (BUILTIN_TYPES.has(schemaType.id)) continue;
    if (!schemaType.meta?.one) continue;

    // Find matching type in edited instance
    const editedType = editedTypes.find((t) => t.id === schemaType.id);
    const atomCount = editedType ? editedType.atoms.length : 0;

    if (atomCount !== 1) {
      issues.push({
        type: 'multiplicity',
        severity: 'warning',
        message: `Sig "${schemaType.id}" is declared "one" but has ${atomCount} atom(s)`,
      });
    }
  }
  return issues;
}

function checkOrphanAtoms(dataInstance: IDataInstance): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const allAtoms = dataInstance.getAtoms();
  const referencedAtoms = new Set<string>();

  for (const rel of dataInstance.getRelations()) {
    for (const tuple of rel.tuples) {
      for (const atomId of tuple.atoms) {
        referencedAtoms.add(atomId);
      }
    }
  }

  for (const atom of allAtoms) {
    if (BUILTIN_TYPES.has(atom.type ?? '')) continue;
    if (!referencedAtoms.has(atom.id)) {
      issues.push({
        type: 'orphan-atom',
        severity: 'warning',
        message: `Atom "${atom.id}" is not referenced by any relation`,
      });
    }
  }
  return issues;
}

/**
 * Validate an edited data instance against the original schema.
 *
 * @param editedDataInstance The current dataInstance from the structured-input-graph element
 * @param originalSchema The AlloyInstance parsed from the original datum XML
 */
export function validateEditedInstance(
  editedDataInstance: unknown,
  originalSchema: AlloyInstance
): ValidationResult {
  const di = editedDataInstance as IDataInstance;

  // Guard: if the dataInstance doesn't have the expected methods, skip validation
  if (
    !di ||
    typeof di.getTypes !== 'function' ||
    typeof di.getRelations !== 'function' ||
    typeof di.getAtoms !== 'function'
  ) {
    return { errors: [], warnings: [], isValid: true };
  }

  const compatMap = buildTypeCompatibilityMap(originalSchema);
  const subtypeMap = buildSubtypeMap(originalSchema);

  const allIssues: ValidationIssue[] = [
    ...checkArities(di, originalSchema),
    ...checkTyping(di, originalSchema, compatMap, subtypeMap),
    ...checkMultiplicities(di, originalSchema),
    ...checkOrphanAtoms(di),
  ];

  const errors = allIssues.filter((i) => i.severity === 'error');
  const warnings = allIssues.filter((i) => i.severity === 'warning');

  return {
    errors,
    warnings,
    isValid: errors.length === 0,
  };
}
