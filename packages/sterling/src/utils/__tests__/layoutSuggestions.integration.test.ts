/** @jest-environment jsdom */

import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { parseCndFile } from '../cndPreParser';
import { suggestAlloyLayout } from '../layoutSuggestions';
import type {
  SpytialDataInstance,
  SpytialRelation,
  SpytialType
} from '../layoutSuggestions';
import { getSpytialCore } from '../spytialCore';
import type { SpytialCoreApi } from '../spytialCore';

const require = createRequire(import.meta.url);

function installedSpytialCore(): SpytialCoreApi {
  const bundlePath = require.resolve('spytial-core');
  const bundle = readFileSync(bundlePath, 'utf8');
  return runInNewContext(`${bundle}\nspytialcore;`, {
    window,
    document,
    navigator,
    HTMLElement,
    customElements,
    DOMParser,
    Node,
    MutationObserver,
    console,
    crypto: globalThis.crypto,
    setTimeout,
    clearTimeout
  }) as SpytialCoreApi;
}

function type(id: string, isBuiltin = false): SpytialType {
  return { id, types: [id, 'univ'], atoms: [], isBuiltin };
}

function relation(
  id: string,
  name: string,
  types: string[],
  tuples: string[][]
): SpytialRelation {
  return {
    id,
    name,
    types,
    tuples: tuples.map((atoms) => ({ atoms, types }))
  };
}

describe('Cope layout suggestion grammar integration', () => {
  it('parses generated canonical directives with the installed spytial-core', () => {
    const core = installedSpytialCore();
    window.spytialcore = core;
    const link = relation(
      'Node<:link',
      'link',
      ['Node', 'Node'],
      [['Node$0', 'Node$1']]
    );
    const data: SpytialDataInstance = {
      getTypes: () => [type('univ', true), type('Node')],
      getRelations: () => [link]
    };
    const generated = suggestAlloyLayout(data);
    const parsed = parseCndFile(generated.spec);
    const discoveredCore = getSpytialCore();

    expect(generated.spec).toContain('edgeStyle:');
    expect(generated.spec).toContain('atomStyle:');
    expect(discoveredCore).toBe(core);
    expect(() =>
      discoveredCore!.parseLayoutSpec(parsed.layoutYaml)
    ).not.toThrow();
  });
});
