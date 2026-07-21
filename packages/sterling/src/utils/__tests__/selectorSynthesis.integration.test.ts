/** @jest-environment jsdom */

import { beforeAll, describe, expect, it } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import {
  resolveValidatedLayout,
  suggestAlloyLayout,
  validateCndSpecWithSpytial
} from '../layoutSuggestions';
import type { SpytialDataInstance } from '../layoutSuggestions';
import { synthesizeAndVerifySelector } from '../selectorSynthesis';
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

const BUILTINS = `<sig label="seq/Int" ID="0" parentID="1" builtin="yes"></sig>
<sig label="Int" ID="1" parentID="2" builtin="yes"></sig>
<sig label="univ" ID="2" builtin="yes"></sig>`;

function instanceXml(body: string): string {
  return `<alloy builddate="test">
<instance bitwidth="4" maxseq="-1" command="test" filename="test.frg">
${BUILTINS}
${body}
</instance>
</alloy>`;
}

/** A binary tree split across two fields with non-magic names. */
const SPLIT_TREE_XML = instanceXml(`<sig label="Node" ID="4" parentID="2">
<atom label="Node0"/><atom label="Node1"/><atom label="Node2"/><atom label="Node3"/><atom label="Node4"/>
</sig>
<field label="lc" ID="5" parentID="4">
<tuple><atom label="Node0"/><atom label="Node1"/></tuple>
<tuple><atom label="Node1"/><atom label="Node3"/></tuple>
<types> <type ID="4"/><type ID="4"/> </types>
</field>
<field label="rc" ID="6" parentID="4">
<tuple><atom label="Node0"/><atom label="Node2"/></tuple>
<tuple><atom label="Node1"/><atom label="Node4"/></tuple>
<types> <type ID="4"/><type ID="4"/> </types>
</field>`);

/** A child-to-parent field with an unfamiliar name; the transpose is the tree. */
const REVERSED_TREE_XML = instanceXml(`<sig label="Task" ID="4" parentID="2">
<atom label="Task0"/><atom label="Task1"/><atom label="Task2"/><atom label="Task3"/>
</sig>
<field label="boss" ID="5" parentID="4">
<tuple><atom label="Task1"/><atom label="Task0"/></tuple>
<tuple><atom label="Task2"/><atom label="Task0"/></tuple>
<tuple><atom label="Task3"/><atom label="Task1"/></tuple>
<types> <type ID="4"/><type ID="4"/> </types>
</field>`);

const SPLIT_TREE_UNION: [string, string][] = [
  ['Node0', 'Node1'],
  ['Node1', 'Node3'],
  ['Node0', 'Node2'],
  ['Node1', 'Node4']
];

const REVERSED_TREE_DOWN: [string, string][] = [
  ['Task0', 'Task1'],
  ['Task0', 'Task2'],
  ['Task1', 'Task3']
];

describe('selector synthesis against the installed spytial-core', () => {
  let core: SpytialCoreApi;

  beforeAll(() => {
    core = installedSpytialCore();
    window.spytialcore = core;
  });

  function load(xml: string): SpytialDataInstance {
    const parsed = (core as any).AlloyInstance.parseAlloyXML(xml);
    return new (core as any).AlloyDataInstance(parsed.instances[0]);
  }

  function evaluatePairs(
    instance: SpytialDataInstance,
    expression: string
  ): Set<string> {
    const evaluator = new (core as any).SGraphQueryEvaluator();
    evaluator.initialize({ sourceData: instance });
    const tuples = evaluator.evaluate(expression).selectedTuplesAll();
    return new Set(tuples.map((t: string[]) => `${t[0]} ${t[1]}`));
  }

  const asKeys = (pairs: [string, string][]) =>
    new Set(pairs.map(([a, b]) => `${a} ${b}`));

  it('adapter round-trip: union extension yields a verified multi-field selector', () => {
    const instance = load(SPLIT_TREE_XML);
    const result = synthesizeAndVerifySelector(
      { arity: 2, matchesByInstance: [SPLIT_TREE_UNION] },
      [instance],
      core
    );
    expect(result).toBeDefined();
    expect(evaluatePairs(instance, result!.expression)).toEqual(
      asKeys(SPLIT_TREE_UNION)
    );
    // The selector must generalize, not enumerate atoms.
    expect(result!.expression).not.toMatch(/Node\d/);
  });

  it('adapter round-trip: reversed extension yields a direction-correct transpose', () => {
    const instance = load(REVERSED_TREE_XML);
    const result = synthesizeAndVerifySelector(
      { arity: 2, matchesByInstance: [REVERSED_TREE_DOWN] },
      [instance],
      core
    );
    expect(result).toBeDefined();
    expect(evaluatePairs(instance, result!.expression)).toEqual(
      asKeys(REVERSED_TREE_DOWN)
    );
    // Ordered-pair semantics: the forward field itself must NOT verify.
    expect(evaluatePairs(instance, 'boss')).not.toEqual(
      asKeys(REVERSED_TREE_DOWN)
    );
  });

  it('suggests one synthesized spine for a split tree and validates end to end', async () => {
    const instance = load(SPLIT_TREE_XML);
    const draft = suggestAlloyLayout(instance, { core });

    const synthesized = draft.suggestions.filter(
      ({ sourceRule }) => sourceRule === 'cope.selector-synthesis'
    );
    expect(synthesized).toHaveLength(1);
    const constraint = synthesized[0]!.patch.constraints?.[0] as {
      orientation: { selector: string; directions: string[] };
    };
    expect(evaluatePairs(instance, constraint.orientation.selector)).toEqual(
      asKeys(SPLIT_TREE_UNION)
    );
    expect(constraint.orientation.directions).toEqual(['below']);

    // The per-field topology candidates are superseded, not duplicated.
    expect(
      draft.suggestions.filter(({ id }) =>
        /^(orientation|cyclic):Node<:(lc|rc)/.test(id)
      )
    ).toHaveLength(0);

    // Whole-document validity through the real parse/evaluate/layout pipeline,
    // and the synthesized primary must survive without falling back.
    const validated = await resolveValidatedLayout(draft, (spec) =>
      validateCndSpecWithSpytial(spec, [instance], core)
    );
    const decision = validated.decisions.find(
      ({ suggestionId }) => suggestionId === synthesized[0]!.id
    );
    expect(decision?.outcome).toBe('applied');
    expect(validated.spec).toContain(constraint.orientation.selector);
  });

  it('suggests a transpose spine for a reversed tree and validates end to end', async () => {
    const instance = load(REVERSED_TREE_XML);
    const draft = suggestAlloyLayout(instance, { core });

    const synthesized = draft.suggestions.filter(
      ({ sourceRule }) => sourceRule === 'cope.selector-synthesis'
    );
    expect(synthesized).toHaveLength(1);
    const constraint = synthesized[0]!.patch.constraints?.[0] as {
      orientation: { selector: string; directions: string[] };
    };
    expect(evaluatePairs(instance, constraint.orientation.selector)).toEqual(
      asKeys(REVERSED_TREE_DOWN)
    );

    const validated = await resolveValidatedLayout(draft, (spec) =>
      validateCndSpecWithSpytial(spec, [instance], core)
    );
    const decision = validated.decisions.find(
      ({ suggestionId }) => suggestionId === synthesized[0]!.id
    );
    expect(decision?.outcome).toBe('applied');
  });

  it('produces the plain direct-selector draft when no core is supplied', () => {
    const instance = load(SPLIT_TREE_XML);
    const draft = suggestAlloyLayout(instance, {});
    expect(
      draft.suggestions.filter(
        ({ sourceRule }) => sourceRule === 'cope.selector-synthesis'
      )
    ).toHaveLength(0);
    // The old per-field candidates are back in charge.
    expect(
      draft.suggestions.some(({ id }) => id.includes('lc') || id.includes('rc'))
    ).toBe(true);
  });

  it('is invariant under consistent atom renaming', () => {
    const renamedXml = SPLIT_TREE_XML.replace(/Node(\d)/g, 'Vertex9$1');
    const original = suggestAlloyLayout(load(SPLIT_TREE_XML), { core });
    const renamed = suggestAlloyLayout(load(renamedXml), { core });
    const selectorOf = (draft: typeof original) =>
      (
        draft.suggestions.find(
          ({ sourceRule }) => sourceRule === 'cope.selector-synthesis'
        )?.patch.constraints?.[0] as any
      )?.orientation?.selector;
    expect(selectorOf(original)).toBeDefined();
    expect(selectorOf(renamed)).toBe(selectorOf(original));
  });
});
