/**
 * Shared fakes for engine/oracle unit tests: a schema-aware fake core whose
 * evaluator errors on unknown names, and whose layout pipeline reports
 * selector errors for specs containing the marker `lft`.
 */

import type { SpytialDataInstance } from '../../utils/layoutSuggestions';
import type { SpytialCoreApi } from '../../utils/spytialCore';

export const KNOWN_FIELDS = ['left', 'right', 'val'];
export const KNOWN_SIGS = ['Tree'];

export const FAKE_INSTANCE: SpytialDataInstance = {
  getTypes: () => [
    { id: 'this/Tree', types: ['this/Tree'], atoms: [{}, {}], isBuiltin: false }
  ],
  getRelations: () =>
    KNOWN_FIELDS.map((name) => ({
      id: name,
      name,
      types: ['this/Tree', 'this/Tree'],
      tuples: [{ atoms: ['Tree0', 'Tree1'], types: ['this/Tree', 'this/Tree'] }]
    }))
};

/** Expressions that evaluate cleanly but to the empty set. */
const EMPTY_EXPRESSIONS = new Set(['left & ~left']);

class FakeEvaluatorResult {
  constructor(
    private readonly expression: string,
    private readonly error: string | undefined
  ) {}

  isError(): boolean {
    return this.error !== undefined;
  }
  noResult(): boolean {
    return EMPTY_EXPRESSIONS.has(this.expression);
  }
  maxArity(): number {
    return KNOWN_FIELDS.some((field) => this.expression.includes(field)) ? 2 : 1;
  }
  selectedAtoms(): string[] {
    return this.noResult() ? [] : ['Tree0'];
  }
  selectedTuplesAll(): string[][] {
    return this.noResult() ? [] : [['Tree0', 'Tree1']];
  }
  prettyPrint(): string {
    return this.error ?? 'ok';
  }
  getRawResult(): unknown {
    return this.error ? { error: new Error(this.error) } : {};
  }
}

class FakeEvaluator {
  initialize(): void {}
  evaluate(expression: string): FakeEvaluatorResult {
    const tokens = expression.split(/[^A-Za-z_]+/).filter(Boolean);
    const unknown = tokens.find(
      (token) => !KNOWN_FIELDS.includes(token) && !KNOWN_SIGS.includes(token)
    );
    return new FakeEvaluatorResult(
      expression,
      unknown ? `NameNotFoundError: ${unknown} is not a sig or field` : undefined
    );
  }
}

class FakeLayoutInstance {
  constructor(private readonly layoutSpec: { raw?: string }) {}
  generateLayout(): {
    layout?: unknown;
    selectorErrors?: unknown[];
    error?: { message: string };
  } {
    const raw = this.layoutSpec?.raw ?? '';
    if (/lft/.test(raw)) {
      return {
        selectorErrors: [
          {
            selector: 'lft',
            context: 'orientation',
            errorMessage: 'lft is not a sig or field'
          }
        ]
      };
    }
    return { layout: {} };
  }
}

/** A fake SpytialCoreApi good enough for the engine's validation paths. */
export function fakeCore(): SpytialCoreApi {
  return {
    AlloyInstance: { parseAlloyXML: () => ({}) },
    AlloyDataInstance: class {} as never,
    SGraphQueryEvaluator: FakeEvaluator as never,
    parseLayoutSpec: (spec: string) => ({ raw: spec, warnings: [] }) as never,
    LayoutInstance: FakeLayoutInstance as never
  };
}
