import { AlloyInstance, applyProjections } from '@/alloy-instance';
import type { SpytialDataInstance } from './layoutSuggestions';
import type { SpytialCoreApi } from './spytialCore';

/**
 * Pre-layout projection over an Alloy data instance.
 *
 * spytial-core shipped this as `applyProjectionTransform` through 5.x and removed it in
 * 6.0.0: the engine lays out exactly the instance it is handed, so a projected view is
 * the host's job. This is that function ported into Cope and Drag. The one difference is
 * the rewrite step — core delegated to `IDataInstance.applyProjections`, which is gone, so
 * this projects the underlying Alloy instance and wraps it in a fresh `AlloyDataInstance`.
 *
 * `evaluateOrderBy` runs against the ORIGINAL instance (the ordering relation, e.g.
 * `next: State -> State`, mentions the atoms projection removes), so initialize the
 * evaluator with the un-projected instance and lay out the projected one.
 */

/** A type (sig) to project over, optionally ordered by a selector's tuples. */
export interface Projection {
  sig: string;
  orderBy?: string;
}

/** The atom chosen for one projected type, plus every atom it could be (display order). */
export interface ProjectionChoice {
  type: string;
  projectedAtom: string;
  atoms: string[];
}

export interface ProjectionTransformOptions {
  /** Returns [from, to] pairs giving a partial order; atoms sort lexicographically without it. */
  evaluateOrderBy?: (selector: string) => string[][];
  /** Called when `evaluateOrderBy` throws; the atoms then fall back to lexicographic order. */
  onOrderByError?: (selector: string, error: unknown) => void;
}

/** An Alloy data instance: projection reads its types and rewrites the Alloy instance beneath. */
type ProjectableInstance = SpytialDataInstance & { getAlloyInstance?(): AlloyInstance };

export interface ProjectionTransformResult<T> {
  instance: T;
  choices: ProjectionChoice[];
}

/**
 * Projects `instance` over `projections`, picking one atom per projected type.
 *
 * @param selections type → chosen atom ID. Mutated to fill in the default (first) atom
 *                   for any projected type left unset, so the caller sees the default.
 */
export function applyProjectionTransform<T extends ProjectableInstance>(
  core: Pick<SpytialCoreApi, 'AlloyDataInstance'>,
  instance: T,
  projections: readonly Projection[],
  selections: Record<string, string>,
  options: ProjectionTransformOptions = {}
): ProjectionTransformResult<T> {
  const projectedSigs = projections.map((p) => p.sig);
  if (projectedSigs.length === 0) {
    return { instance, choices: [] };
  }

  const allTypes = instance.getTypes();

  // For each projected sig, collect atoms from every type whose hierarchy includes it
  // (abstract sigs / subtypes).
  const atomsPerType: Record<string, string[]> = {};
  for (const projection of projections) {
    const sig = projection.sig;
    const matchingTypes = allTypes.filter((t) => t.id === sig || t.types.includes(sig));
    if (matchingTypes.length === 0) {
      throw new Error(`Projected type '${sig}' not found in data instance`);
    }

    // Deduplicate: parent sigs may list their subsigs' atoms.
    const atomSet = new Set<string>();
    for (const type of matchingTypes) {
      for (const atom of type.atoms as readonly { id: string }[]) {
        atomSet.add(atom.id);
      }
    }
    let atoms = [...atomSet];

    if (projection.orderBy && options.evaluateOrderBy) {
      try {
        atoms = topologicalSortWithCycleBreaking(
          atoms,
          options.evaluateOrderBy(projection.orderBy)
        );
      } catch (error) {
        options.onOrderByError?.(projection.orderBy, error);
        atoms.sort((a, b) => a.localeCompare(b));
      }
    } else {
      atoms.sort((a, b) => a.localeCompare(b));
    }

    atomsPerType[sig] = atoms;
  }

  const projectedAtomIds: string[] = [];
  for (const [typeId, atomIds] of Object.entries(atomsPerType)) {
    if (atomIds.length === 0) continue;
    if (!selections[typeId]) {
      selections[typeId] = atomIds[0];
    }
    projectedAtomIds.push(selections[typeId]);
  }

  const choices: ProjectionChoice[] = Object.entries(selections)
    .filter(([typeId]) => projectedSigs.includes(typeId))
    .map(([typeId, atomId]) => ({
      type: typeId,
      projectedAtom: atomId,
      atoms: atomsPerType[typeId] || []
    }));

  if (typeof instance.getAlloyInstance !== 'function') {
    throw new Error('Projection needs an Alloy data instance');
  }
  const projected = applyProjections(instance.getAlloyInstance(), projectedAtomIds);
  return { instance: new core.AlloyDataInstance(projected) as T, choices };
}

/**
 * Topological sort with cycle breaking (Kahn's algorithm).
 *
 * Orders `atoms` to respect the [from, to] pairs where possible; ties and cycles are
 * broken by taking the lexicographically smallest atom.
 */
export function topologicalSortWithCycleBreaking(
  atoms: string[],
  tuples: string[][]
): string[] {
  const atomSet = new Set(atoms);
  const adjacency = new Map<string, Set<string>>();
  const inDegree = new Map<string, number>();

  for (const atom of atoms) {
    adjacency.set(atom, new Set());
    inDegree.set(atom, 0);
  }

  for (const tuple of tuples) {
    if (tuple.length < 2) continue;
    const [from, to] = tuple;
    if (atomSet.has(from) && atomSet.has(to) && from !== to) {
      const neighbors = adjacency.get(from)!;
      if (!neighbors.has(to)) {
        neighbors.add(to);
        inDegree.set(to, (inDegree.get(to) || 0) + 1);
      }
    }
  }

  const result: string[] = [];
  const remaining = new Set(atoms);

  while (remaining.size > 0) {
    const ready = [...remaining].filter((atom) => (inDegree.get(atom) || 0) === 0);
    if (ready.length === 0) {
      // Cycle: break it at the lexicographically smallest remaining atom.
      ready.push(...remaining);
    }
    ready.sort((a, b) => a.localeCompare(b));

    const node = ready[0];
    result.push(node);
    remaining.delete(node);

    for (const neighbor of adjacency.get(node) || []) {
      if (remaining.has(neighbor)) {
        inDegree.set(neighbor, (inDegree.get(neighbor) || 1) - 1);
      }
    }
  }

  return result;
}
