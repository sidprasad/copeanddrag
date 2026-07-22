/**
 * Serialize the current instance's schema for LLM grounding.
 *
 * Prefers the core bundle's own serializers (generateAlloySchema /
 * generateTextDescription) so the model sees the same rendering other core
 * surfaces use; falls back to a manual rendering from getTypes()/getRelations()
 * on older cores. Declaration metadata (abstract/one/enum) only exists on the
 * raw parsed instance, so it is appended from there when available.
 */

import type {
  RawAlloyInstance,
  SpytialDataInstance
} from '../utils/layoutSuggestions';
import type { SpytialCoreApi } from '../utils/spytialCore';

export interface SchemaSummaryOptions {
  instances: readonly SpytialDataInstance[];
  core?: SpytialCoreApi;
  rawInstance?: RawAlloyInstance;
}

function shortTypeName(id: string): string {
  // Alloy type ids can be qualified (this/Node); the bare name is what
  // selectors use.
  const parts = id.split('/');
  return parts[parts.length - 1] ?? id;
}

function manualSchema(instance: SpytialDataInstance): string {
  const lines: string[] = [];
  for (const type of instance.getTypes()) {
    if (type.isBuiltin) continue;
    lines.push(`sig ${shortTypeName(type.id)} (${type.atoms.length} atoms)`);
  }
  for (const relation of instance.getRelations()) {
    const columns = relation.types.map(shortTypeName).join(' -> ');
    lines.push(
      `field ${relation.name}: ${columns} (${relation.tuples.length} tuples)`
    );
  }
  return lines.join('\n');
}

function declarationFacts(rawInstance: RawAlloyInstance): string[] {
  const facts: string[] = [];
  for (const type of Object.values(rawInstance.types)) {
    const meta = type.meta;
    if (!meta || meta.builtin || meta.private) continue;
    const name = shortTypeName(type.id);
    const flags = [
      meta.abstract ? 'abstract (never instantiated directly)' : null,
      meta.one ? 'a singleton' : null,
      meta.enum ? 'an enum value' : null
    ].filter((flag): flag is string => flag !== null);
    if (flags.length > 0) {
      facts.push(`- ${name} is ${flags.join(' and ')}`);
    }
  }
  return facts;
}

/** Build the per-request schema grounding block for the system prompt. */
export function buildSchemaSummary(options: SchemaSummaryOptions): string {
  const { instances, core, rawInstance } = options;
  const primary = instances[0];
  if (!primary) return 'No instance is loaded.';

  const sections: string[] = [];

  let schemaText: string | undefined;
  if (core?.generateAlloySchema) {
    try {
      schemaText = core.generateAlloySchema(primary);
    } catch {
      schemaText = undefined;
    }
  }
  sections.push('## Data schema\n' + (schemaText ?? manualSchema(primary)));

  if (core?.generateTextDescription) {
    try {
      sections.push('## Population\n' + core.generateTextDescription(primary));
    } catch {
      // counts are a nice-to-have; the schema section already stands alone
    }
  } else if (schemaText) {
    // The Alloy-style schema has no counts; add the manual listing for them.
    sections.push('## Population\n' + manualSchema(primary));
  }

  if (rawInstance) {
    const facts = declarationFacts(rawInstance);
    if (facts.length > 0) {
      sections.push('## Declaration facts\n' + facts.join('\n'));
    }
  }

  if (instances.length > 1) {
    sections.push(
      `The datum has ${instances.length} states; selectors must make sense in every state, not just the first.`
    );
  }

  return sections.join('\n\n');
}
