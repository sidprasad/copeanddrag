/**
 * The closed CnD vocabulary, as YAML keys (docs/cnd/yaml-spec.md), and a
 * structural validator for LLM-produced patches.
 *
 * These tables are the enforcement layer behind the prompt's language
 * reference: whatever the model emits is checked here before any oracle runs,
 * and violations name the allowed alternatives so the repair message is
 * self-contained. Deliberately excludes the legacy forms (atomColor,
 * edgeColor) and the builder-internal type names (groupfield/groupselector).
 */

import type { CndPatch } from '../utils/layoutSuggestions';

export const ORIENTATION_DIRECTIONS = [
  'above',
  'below',
  'left',
  'right',
  'directlyAbove',
  'directlyBelow',
  'directlyLeft',
  'directlyRight'
] as const;

export const CYCLIC_ROTATIONS = ['clockwise', 'counterclockwise'] as const;
export const ALIGN_DIRECTIONS = ['horizontal', 'vertical'] as const;
export const HOLD_VALUES = ['always', 'never'] as const;
export const FLAG_NAMES = [
  'hideDisconnected',
  'hideDisconnectedBuiltIns'
] as const;
export const EDGE_LINE_STYLES = ['solid', 'dashed', 'dotted'] as const;

export const CONSTRAINT_KEYS = [
  'orientation',
  'cyclic',
  'align',
  'group',
  'size',
  'hideAtom'
] as const;

export const DIRECTIVE_KEYS = [
  'atomStyle',
  'edgeStyle',
  'icon',
  'attribute',
  'tag',
  'hideField',
  'hideAtom',
  'inferredEdge',
  'flag'
] as const;

/** A selector expression found in a patch, with where it came from. */
export interface SelectorSite {
  expression: string;
  /** e.g. "constraint 1 (orientation) selector" */
  context: string;
  /** Tuple width the surrounding form needs; undefined = any. */
  expectedArity?: number;
}

/** A field-NAME reference (not an expression) found in a patch. */
export interface FieldRefSite {
  field: string;
  context: string;
}

type Entry = Record<string, unknown>;

const isPlainObject = (value: unknown): value is Entry =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

interface FieldRule {
  required?: boolean;
  kind: 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'stringArray';
  values?: readonly string[];
}

function checkFields(
  context: string,
  body: Entry,
  rules: Record<string, FieldRule>,
  problems: string[]
): void {
  for (const key of Object.keys(body)) {
    if (!(key in rules)) {
      problems.push(
        `${context}: unknown field "${key}". Allowed fields: ${Object.keys(rules).join(', ')}.`
      );
    }
  }
  for (const [key, rule] of Object.entries(rules)) {
    const value = body[key];
    if (value === undefined) {
      if (rule.required) {
        problems.push(`${context}: missing required field "${key}".`);
      }
      continue;
    }
    switch (rule.kind) {
      case 'string':
        if (!isNonEmptyString(value)) {
          problems.push(`${context}: "${key}" must be a non-empty string.`);
        } else if (rule.values && !rule.values.includes(value)) {
          problems.push(
            `${context}: "${key}" must be one of: ${rule.values.join(', ')} (got "${value}").`
          );
        }
        break;
      case 'number':
        if (typeof value !== 'number' || !(value > 0)) {
          problems.push(`${context}: "${key}" must be a number > 0.`);
        }
        break;
      case 'integer':
        if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
          problems.push(`${context}: "${key}" must be a non-negative integer.`);
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          problems.push(`${context}: "${key}" must be true or false.`);
        }
        break;
      case 'object':
        if (!isPlainObject(value)) {
          problems.push(`${context}: "${key}" must be an object.`);
        }
        break;
      case 'stringArray':
        if (
          !Array.isArray(value) ||
          value.length === 0 ||
          !value.every(isNonEmptyString)
        ) {
          problems.push(
            `${context}: "${key}" must be a non-empty array of strings.`
          );
        } else if (rule.values) {
          for (const item of value) {
            if (!rule.values.includes(item)) {
              problems.push(
                `${context}: "${key}" contains "${item}"; allowed values: ${rule.values.join(', ')}.`
              );
            }
          }
        }
        break;
    }
  }
}

const HOLD_RULE: FieldRule = { kind: 'string', values: HOLD_VALUES };

function checkOrientationDirections(
  context: string,
  directions: unknown,
  problems: string[]
): void {
  if (!Array.isArray(directions)) return; // typed error already reported
  const set = new Set(directions.filter(isNonEmptyString));
  if (set.has('above') && set.has('below')) {
    problems.push(`${context}: cannot combine "above" with "below".`);
  }
  if (set.has('left') && set.has('right')) {
    problems.push(`${context}: cannot combine "left" with "right".`);
  }
  for (const direct of [
    'directlyAbove',
    'directlyBelow',
    'directlyLeft',
    'directlyRight'
  ]) {
    if (!set.has(direct)) continue;
    const counterpart = direct.replace('directly', '').toLowerCase();
    for (const other of set) {
      if (other !== direct && other !== counterpart) {
        problems.push(
          `${context}: "${direct}" can only combine with "${counterpart}" (got "${other}").`
        );
      }
    }
  }
}

function validateConstraintEntry(
  index: number,
  entry: unknown,
  problems: string[]
): void {
  const context = `constraint ${index + 1}`;
  if (!isPlainObject(entry)) {
    problems.push(`${context}: each constraint must be an object like {orientation: {...}}.`);
    return;
  }
  const keys = Object.keys(entry);
  if (keys.length !== 1) {
    problems.push(
      `${context}: must have exactly one key from: ${CONSTRAINT_KEYS.join(', ')} (got ${keys.join(', ') || 'none'}).`
    );
    return;
  }
  const key = keys[0]!;
  const body = entry[key];
  const label = `${context} (${key})`;
  if (!(CONSTRAINT_KEYS as readonly string[]).includes(key)) {
    problems.push(
      `${context}: unknown constraint "${key}". Allowed constraints: ${CONSTRAINT_KEYS.join(', ')}.`
    );
    return;
  }
  if (!isPlainObject(body)) {
    problems.push(`${label}: value must be an object of fields.`);
    return;
  }

  switch (key) {
    case 'orientation':
      checkFields(
        label,
        body,
        {
          selector: { required: true, kind: 'string' },
          directions: {
            required: true,
            kind: 'stringArray',
            values: ORIENTATION_DIRECTIONS
          },
          hold: HOLD_RULE
        },
        problems
      );
      checkOrientationDirections(label, body.directions, problems);
      break;
    case 'cyclic':
      checkFields(
        label,
        body,
        {
          selector: { required: true, kind: 'string' },
          direction: { kind: 'string', values: CYCLIC_ROTATIONS },
          hold: HOLD_RULE
        },
        problems
      );
      break;
    case 'align':
      checkFields(
        label,
        body,
        {
          selector: { required: true, kind: 'string' },
          direction: { required: true, kind: 'string', values: ALIGN_DIRECTIONS },
          hold: HOLD_RULE
        },
        problems
      );
      break;
    case 'group':
      if ('field' in body) {
        checkFields(
          label,
          body,
          {
            field: { required: true, kind: 'string' },
            groupOn: { required: true, kind: 'integer' },
            addToGroup: { required: true, kind: 'integer' },
            selector: { kind: 'string' }
          },
          problems
        );
      } else {
        checkFields(
          label,
          body,
          {
            selector: { required: true, kind: 'string' },
            name: { kind: 'string' },
            addEdge: { kind: 'boolean' },
            hold: HOLD_RULE
          },
          problems
        );
        if (body.hold !== 'never' && !isNonEmptyString(body.name)) {
          problems.push(
            `${label}: "name" is required unless the group has hold: never.`
          );
        }
      }
      break;
    case 'size':
      checkFields(
        label,
        body,
        {
          selector: { required: true, kind: 'string' },
          width: { kind: 'number' },
          height: { kind: 'number' }
        },
        problems
      );
      break;
    case 'hideAtom':
      checkFields(
        label,
        body,
        { selector: { required: true, kind: 'string' } },
        problems
      );
      break;
  }
}

function validateDirectiveEntry(
  index: number,
  entry: unknown,
  problems: string[]
): void {
  const context = `directive ${index + 1}`;
  if (!isPlainObject(entry)) {
    problems.push(`${context}: each directive must be an object like {attribute: {...}}.`);
    return;
  }
  const keys = Object.keys(entry);
  if (keys.length !== 1) {
    problems.push(
      `${context}: must have exactly one key from: ${DIRECTIVE_KEYS.join(', ')} (got ${keys.join(', ') || 'none'}).`
    );
    return;
  }
  const key = keys[0]!;
  const body = entry[key];
  const label = `${context} (${key})`;
  if (!(DIRECTIVE_KEYS as readonly string[]).includes(key)) {
    problems.push(
      `${context}: unknown directive "${key}". Allowed directives: ${DIRECTIVE_KEYS.join(', ')}.`
    );
    return;
  }

  if (key === 'flag') {
    if (
      !isNonEmptyString(body) ||
      !(FLAG_NAMES as readonly string[]).includes(body)
    ) {
      problems.push(
        `${label}: value must be one of: ${FLAG_NAMES.join(', ')} (e.g. "- flag: hideDisconnected").`
      );
    }
    return;
  }

  if (!isPlainObject(body)) {
    problems.push(`${label}: value must be an object of fields.`);
    return;
  }

  switch (key) {
    case 'atomStyle':
      checkFields(
        label,
        body,
        {
          selector: { kind: 'string' },
          shape: { kind: 'string' },
          fillStyle: { kind: 'object' },
          borderStyle: { kind: 'object' },
          textStyle: { kind: 'object' }
        },
        problems
      );
      break;
    case 'edgeStyle':
      checkFields(
        label,
        body,
        {
          field: { required: true, kind: 'string' },
          selector: { kind: 'string' },
          filter: { kind: 'string' },
          lineStyle: { kind: 'object' },
          textStyle: { kind: 'object' },
          showLabel: { kind: 'boolean' },
          hidden: { kind: 'boolean' }
        },
        problems
      );
      break;
    case 'icon':
      checkFields(
        label,
        body,
        {
          selector: { required: true, kind: 'string' },
          path: { required: true, kind: 'string' },
          showLabels: { kind: 'boolean' }
        },
        problems
      );
      break;
    case 'attribute':
      checkFields(
        label,
        body,
        {
          field: { required: true, kind: 'string' },
          selector: { kind: 'string' },
          filter: { kind: 'string' }
        },
        problems
      );
      break;
    case 'tag':
      checkFields(
        label,
        body,
        {
          toTag: { required: true, kind: 'string' },
          name: { required: true, kind: 'string' },
          value: { required: true, kind: 'string' }
        },
        problems
      );
      break;
    case 'hideField':
      checkFields(
        label,
        body,
        {
          field: { required: true, kind: 'string' },
          selector: { kind: 'string' },
          filter: { kind: 'string' }
        },
        problems
      );
      break;
    case 'hideAtom':
      checkFields(
        label,
        body,
        { selector: { required: true, kind: 'string' } },
        problems
      );
      break;
    case 'inferredEdge':
      checkFields(
        label,
        body,
        {
          name: { required: true, kind: 'string' },
          selector: { required: true, kind: 'string' },
          color: { kind: 'string' },
          style: { kind: 'string', values: EDGE_LINE_STYLES },
          weight: { kind: 'number' }
        },
        problems
      );
      break;
  }
}

const PATCH_KEYS = ['constraints', 'directives', 'projections', 'temporal'];

/**
 * Structurally validate an LLM-produced patch against the closed vocabulary.
 * Returns problem strings (empty = clean). Selector EXPRESSIONS are not judged
 * here — that is the oracle stages' job.
 */
export function validatePatch(patch: unknown): string[] {
  const problems: string[] = [];
  if (!isPlainObject(patch)) {
    return ['patch must be an object with "constraints" and/or "directives" arrays.'];
  }
  for (const key of Object.keys(patch)) {
    if (!PATCH_KEYS.includes(key)) {
      problems.push(
        `patch: unknown top-level key "${key}". Allowed keys: ${PATCH_KEYS.join(', ')}.`
      );
    }
  }
  const { constraints, directives } = patch as CndPatch;
  if (constraints !== undefined) {
    if (!Array.isArray(constraints)) {
      problems.push('patch: "constraints" must be an array.');
    } else {
      constraints.forEach((entry, index) =>
        validateConstraintEntry(index, entry, problems)
      );
    }
  }
  if (directives !== undefined) {
    if (!Array.isArray(directives)) {
      problems.push('patch: "directives" must be an array.');
    } else {
      directives.forEach((entry, index) =>
        validateDirectiveEntry(index, entry, problems)
      );
    }
  }
  if (constraints === undefined && directives === undefined) {
    problems.push('patch: must contain at least one of "constraints" or "directives".');
  }
  return problems;
}

function pushSelector(
  sites: SelectorSite[],
  context: string,
  expression: unknown,
  expectedArity?: number
): void {
  if (isNonEmptyString(expression)) {
    sites.push({
      expression,
      context,
      ...(expectedArity !== undefined ? { expectedArity } : {})
    });
  }
}

/** Every selector expression in a (structurally valid) patch, with context. */
export function collectSelectorSites(patch: CndPatch): SelectorSite[] {
  const sites: SelectorSite[] = [];
  (patch.constraints ?? []).forEach((entry, index) => {
    const key = Object.keys(entry)[0];
    const body = entry[key as string];
    if (!isPlainObject(body)) return;
    const label = `constraint ${index + 1} (${key}) selector`;
    switch (key) {
      case 'orientation':
      case 'cyclic':
        pushSelector(sites, label, body.selector, 2);
        break;
      case 'align':
        pushSelector(sites, label, body.selector);
        break;
      case 'group':
        // Field-form group's selector is a unary source filter.
        pushSelector(sites, label, body.selector, 'field' in body ? 1 : undefined);
        break;
      case 'size':
      case 'hideAtom':
        pushSelector(sites, label, body.selector, 1);
        break;
    }
  });
  (patch.directives ?? []).forEach((entry, index) => {
    const key = Object.keys(entry)[0];
    const body = entry[key as string];
    if (!isPlainObject(body)) return;
    const label = (suffix: string) => `directive ${index + 1} (${key}) ${suffix}`;
    switch (key) {
      case 'atomStyle':
      case 'icon':
      case 'hideAtom':
        pushSelector(sites, label('selector'), body.selector, 1);
        break;
      case 'edgeStyle':
      case 'attribute':
      case 'hideField':
        pushSelector(sites, label('selector'), body.selector, 1);
        pushSelector(sites, label('filter'), body.filter);
        break;
      case 'tag':
        pushSelector(sites, label('toTag'), body.toTag, 1);
        pushSelector(sites, label('value'), body.value);
        break;
      case 'inferredEdge':
        pushSelector(sites, label('selector'), body.selector, 2);
        break;
    }
  });
  return sites;
}

/** Every field-NAME reference in a patch (checked against schema relations). */
export function collectFieldRefSites(patch: CndPatch): FieldRefSite[] {
  const sites: FieldRefSite[] = [];
  (patch.constraints ?? []).forEach((entry, index) => {
    const key = Object.keys(entry)[0];
    const body = entry[key as string];
    if (key === 'group' && isPlainObject(body) && isNonEmptyString(body.field)) {
      sites.push({
        field: body.field,
        context: `constraint ${index + 1} (group) field`
      });
    }
  });
  (patch.directives ?? []).forEach((entry, index) => {
    const key = Object.keys(entry)[0];
    const body = entry[key as string];
    if (
      (key === 'edgeStyle' || key === 'attribute' || key === 'hideField') &&
      isPlainObject(body) &&
      isNonEmptyString(body.field)
    ) {
      sites.push({
        field: body.field,
        context: `directive ${index + 1} (${key}) field`
      });
    }
  });
  return sites;
}
