import { describe, expect, it } from '@jest/globals';
import { buildSchemaSummary } from '../schemaSummary';
import type {
  RawAlloyInstance,
  SpytialDataInstance
} from '../../utils/layoutSuggestions';

const TREE_INSTANCE: SpytialDataInstance = {
  getTypes: () => [
    { id: 'this/Tree', types: ['this/Tree'], atoms: [{}, {}, {}], isBuiltin: false },
    { id: 'Int', types: ['Int'], atoms: [], isBuiltin: true }
  ],
  getRelations: () => [
    {
      id: 'left',
      name: 'left',
      types: ['this/Tree', 'this/Tree'],
      tuples: [{ atoms: ['Tree0', 'Tree1'], types: ['this/Tree', 'this/Tree'] }]
    }
  ]
};

const RAW: RawAlloyInstance = {
  types: {
    'this/Tree': { id: 'this/Tree', types: ['this/Tree'] },
    'this/Root': {
      id: 'this/Root',
      types: ['this/Root', 'this/Tree'],
      meta: { one: true }
    },
    'this/Kind': {
      id: 'this/Kind',
      types: ['this/Kind'],
      meta: { abstract: true, enum: true }
    },
    Int: { id: 'Int', types: ['Int'], meta: { builtin: true } }
  }
};

describe('buildSchemaSummary', () => {
  it('falls back to a manual rendering without a core', () => {
    const summary = buildSchemaSummary({ instances: [TREE_INSTANCE] });
    expect(summary).toContain('sig Tree (3 atoms)');
    expect(summary).toContain('field left: Tree -> Tree (1 tuples)');
    expect(summary).not.toContain('sig Int');
  });

  it('prefers the core serializers when present', () => {
    const summary = buildSchemaSummary({
      instances: [TREE_INSTANCE],
      core: {
        generateAlloySchema: () => 'sig Tree {\n  left: Tree\n}',
        generateTextDescription: () => 'Types:\n- Tree (3 atoms)'
      } as never
    });
    expect(summary).toContain('sig Tree {');
    expect(summary).toContain('## Population');
    expect(summary).toContain('Tree (3 atoms)');
  });

  it('appends declaration facts from the raw instance', () => {
    const summary = buildSchemaSummary({
      instances: [TREE_INSTANCE],
      rawInstance: RAW
    });
    expect(summary).toContain('Root is a singleton');
    expect(summary).toContain('Kind is abstract');
    expect(summary).not.toContain('Int is');
  });

  it('notes multi-state data', () => {
    const summary = buildSchemaSummary({
      instances: [TREE_INSTANCE, TREE_INSTANCE, TREE_INSTANCE]
    });
    expect(summary).toContain('3 states');
  });

  it('survives an empty instance list', () => {
    expect(buildSchemaSummary({ instances: [] })).toContain('No instance');
  });
});
