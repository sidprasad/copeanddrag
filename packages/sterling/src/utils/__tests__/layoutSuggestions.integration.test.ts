/** @jest-environment jsdom */

import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { parseCndFile } from '../cndPreParser';
import {
  resolveValidatedLayout,
  suggestAlloyLayout,
  validateCndSpecWithSpytial
} from '../layoutSuggestions';
import type {
  SpytialDataInstance,
  SpytialRelation,
  SpytialType
} from '../layoutSuggestions';
import { getSpytialCore } from '../spytialCore';
import type { SpytialCoreApi } from '../spytialCore';

const require = createRequire(import.meta.url);

// The bundle registers custom elements, so it may only be evaluated once
// per jsdom window; every test shares this instance.
let cachedCore: SpytialCoreApi | undefined;

function installedSpytialCore(): SpytialCoreApi {
  if (cachedCore) return cachedCore;
  const bundlePath = require.resolve('spytial-core');
  const bundle = readFileSync(bundlePath, 'utf8');
  cachedCore = runInNewContext(`${bundle}\nspytialcore;`, {
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
  return cachedCore;
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
    expect(generated.spec).not.toContain('atomStyle:');
    expect(discoveredCore).toBe(core);
    expect(() =>
      discoveredCore!.parseLayoutSpec(parsed.layoutYaml)
    ).not.toThrow();
  });

  it('never references the Forge no-field-guard sentinel in a draft', () => {
    // Exactly the artifact Forge emits: an empty field declared on univ.
    const xml = `<alloy builddate="test">
<instance bitwidth="4" maxseq="-1" command="test" filename="test.frg">
<sig label="seq/Int" ID="0" parentID="1" builtin="yes"></sig>
<sig label="Int" ID="1" parentID="2" builtin="yes"></sig>
<sig label="univ" ID="2" builtin="yes"></sig>
<field label="no-field-guard" ID="3" parentID="2">
<types> <type ID="2"/><type ID="2"/> </types>
</field>
<sig label="Node" ID="4" parentID="2">
<atom label="Node0"/><atom label="Node1"/><atom label="Node2"/>
</sig>
<field label="link" ID="5" parentID="4">
<tuple><atom label="Node0"/><atom label="Node1"/></tuple>
<tuple><atom label="Node1"/><atom label="Node2"/></tuple>
<types> <type ID="4"/><type ID="4"/> </types>
</field>
</instance>
</alloy>`;
    const core = installedSpytialCore();
    const parsed = (core as any).AlloyInstance.parseAlloyXML(xml);
    const data = new (core as any).AlloyDataInstance(parsed.instances[0]);
    const draft = suggestAlloyLayout(data, { core });
    expect(JSON.stringify(draft.suggestions)).not.toContain('no-field-guard');
    expect(draft.spec).not.toContain('no-field-guard');
    // The real model is still fully analyzed.
    expect(
      draft.suggestions.some(({ id }) => id.includes('Node<:link'))
    ).toBe(true);
  });

  it('keeps an inferred temporal projection through the real core pipeline', async () => {
    const xml = `<alloy builddate="test">
<instance bitwidth="4" maxseq="-1" command="test" filename="test.frg">
<sig label="seq/Int" ID="0" parentID="1" builtin="yes"></sig>
<sig label="Int" ID="1" parentID="2" builtin="yes"></sig>
<sig label="univ" ID="2" builtin="yes"></sig>
<sig label="State" ID="3" parentID="2">
<atom label="State0"/><atom label="State1"/>
</sig>
<sig label="Node" ID="4" parentID="2">
<atom label="Node0"/><atom label="Node1"/>
</sig>
<field label="edge" ID="5" parentID="4">
<tuple><atom label="Node0"/><atom label="Node1"/><atom label="State0"/></tuple>
<types> <type ID="4"/><type ID="4"/><type ID="3"/> </types>
</field>
<field label="next" ID="6" parentID="3">
<tuple><atom label="State0"/><atom label="State1"/></tuple>
<types> <type ID="3"/><type ID="3"/> </types>
</field>
</instance>
</alloy>`;
    const core = installedSpytialCore();
    const parsed = (core as any).AlloyInstance.parseAlloyXML(xml);
    const data = new (core as any).AlloyDataInstance(parsed.instances[0]);
    const proposal = suggestAlloyLayout(data, {
      rawAlloyInstance: parsed.instances[0],
      core
    });
    const resolved = await resolveValidatedLayout(proposal, (spec) =>
      validateCndSpecWithSpytial(spec, [data], core)
    );

    expect(resolved.document.projections).toEqual([
      { sig: 'State', orderBy: 'next' }
    ]);
    expect(resolved.decisions).toContainEqual(
      expect.objectContaining({
        suggestionId: 'projection:State',
        outcome: 'applied'
      })
    );
  });

  it('validates multiple inferred temporal projections together', async () => {
    const xml = `<alloy builddate="test">
<instance bitwidth="4" maxseq="-1" command="test" filename="test.frg">
<sig label="seq/Int" ID="0" parentID="1" builtin="yes"></sig>
<sig label="Int" ID="1" parentID="2" builtin="yes"></sig>
<sig label="univ" ID="2" builtin="yes"></sig>
<sig label="State" ID="3" parentID="2">
<atom label="State0"/><atom label="State1"/>
</sig>
<sig label="Tick" ID="4" parentID="2">
<atom label="Tick0"/><atom label="Tick1"/>
</sig>
</instance>
</alloy>`;
    const core = installedSpytialCore();
    const parsed = (core as any).AlloyInstance.parseAlloyXML(xml);
    const data = new (core as any).AlloyDataInstance(parsed.instances[0]);
    const proposal = suggestAlloyLayout(data, {
      rawAlloyInstance: parsed.instances[0],
      core
    });
    const resolved = await resolveValidatedLayout(proposal, (spec) =>
      validateCndSpecWithSpytial(spec, [data], core)
    );

    expect(resolved.document.projections).toEqual([
      { sig: 'State' },
      { sig: 'Tick' }
    ]);
    expect(
      resolved.decisions.filter(
        ({ suggestionId, outcome }) =>
          suggestionId.startsWith('projection:') && outcome === 'applied'
      )
    ).toHaveLength(2);
  });
});
