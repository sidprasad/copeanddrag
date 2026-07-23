import * as yaml from 'js-yaml';
import { parseCndFile } from './cndPreParser';
import type { CndProjection, SequencePolicyName } from './cndPreParser';

function parseDocument(spec: string): Record<string, unknown> {
  if (!spec.trim()) return {};

  const raw = yaml.load(spec);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('The CnD spec must be a YAML mapping.');
  }
  return raw as Record<string, unknown>;
}

function renderDocument(document: Record<string, unknown>): string {
  return Object.keys(document).length === 0
    ? ''
    : yaml.dump(document, { lineWidth: -1 });
}

/** Read projections from the live full-document text. */
export function getCndSpecProjections(spec: string): CndProjection[] {
  return parseCndFile(spec).projections;
}

/** Replace only the projection section, preserving every other CnD section. */
export function updateCndSpecProjections(
  spec: string,
  projections: readonly CndProjection[]
): string {
  const document = parseDocument(spec);
  delete document.projections;
  delete document.projection;

  if (projections.length > 0) {
    document.projections = projections.map(({ type, orderBy }) => ({
      sig: type,
      ...(orderBy ? { orderBy } : {})
    }));
  }

  return renderDocument(document);
}

/** Replace only the temporal policy, preserving every other CnD section. */
export function updateCndSpecTemporalPolicy(
  spec: string,
  policy: SequencePolicyName
): string {
  const document = parseDocument(spec);
  delete document.sequence;

  if (policy === 'ignore_history') {
    delete document.temporal;
  } else {
    document.temporal = { policy };
  }

  return renderDocument(document);
}
