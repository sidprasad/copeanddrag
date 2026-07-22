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

/** The field name f is overloaded: declared on both A and B (#143 Phase 2). */
const OVERLOADED_FIELD_XML = instanceXml(`<sig label="A" ID="4" parentID="2">
<atom label="A0"/><atom label="A1"/><atom label="A2"/>
</sig>
<sig label="B" ID="5" parentID="2">
<atom label="B0"/><atom label="B1"/>
</sig>
<field label="f" ID="6" parentID="4">
<tuple><atom label="A0"/><atom label="A1"/></tuple>
<tuple><atom label="A1"/><atom label="A2"/></tuple>
<types> <type ID="4"/><type ID="4"/> </types>
</field>
<field label="f" ID="7" parentID="5">
<tuple><atom label="B0"/><atom label="B1"/></tuple>
<types> <type ID="5"/><type ID="5"/> </types>
</field>`);

/**
 * Overloaded f again, but the B declaration is EMPTY in this instance: the
 * bare name is extensionally equal to the A part here, yet still denotes
 * the union of both declarations in any instance where B's f has tuples.
 */
const OVERLOADED_EMPTY_SIBLING_XML = instanceXml(`<sig label="A" ID="4" parentID="2">
<atom label="A0"/><atom label="A1"/><atom label="A2"/>
</sig>
<sig label="B" ID="5" parentID="2">
<atom label="B0"/><atom label="B1"/>
</sig>
<field label="f" ID="6" parentID="4">
<tuple><atom label="A0"/><atom label="A1"/></tuple>
<tuple><atom label="A1"/><atom label="A2"/></tuple>
<types> <type ID="4"/><type ID="4"/> </types>
</field>
<field label="f" ID="7" parentID="5">
<types> <type ID="5"/><type ID="5"/> </types>
</field>`);

/**
 * A field declared on an abstract supertype whose full extension has no
 * clean topology: the Item part is a chain while the Ghost part is a ring.
 */
const NARROWED_FIELD_XML = instanceXml(`<sig label="Elem" ID="4" parentID="2" abstract="yes">
</sig>
<sig label="Item" ID="5" parentID="4">
<atom label="Item0"/><atom label="Item1"/><atom label="Item2"/>
</sig>
<sig label="Ghost" ID="6" parentID="4">
<atom label="Ghost0"/><atom label="Ghost1"/><atom label="Ghost2"/>
</sig>
<field label="nxt" ID="7" parentID="4">
<tuple><atom label="Item0"/><atom label="Item1"/></tuple>
<tuple><atom label="Item1"/><atom label="Item2"/></tuple>
<tuple><atom label="Ghost0"/><atom label="Ghost1"/></tuple>
<tuple><atom label="Ghost1"/><atom label="Ghost2"/></tuple>
<tuple><atom label="Ghost2"/><atom label="Ghost0"/></tuple>
<types> <type ID="4"/><type ID="4"/> </types>
</field>`);

/** A file-system hierarchy through an Entry indirection: contents.object. */
const INDIRECTION_XML = instanceXml(`<sig label="Obj" ID="4" parentID="2" abstract="yes"></sig>
<sig label="Dir" ID="5" parentID="4">
<atom label="Dir0"/><atom label="Dir1"/>
</sig>
<sig label="File" ID="6" parentID="4">
<atom label="File0"/><atom label="File1"/>
</sig>
<sig label="Entry" ID="7" parentID="2">
<atom label="Entry0"/><atom label="Entry1"/><atom label="Entry2"/>
</sig>
<field label="contents" ID="8" parentID="5">
<tuple><atom label="Dir0"/><atom label="Entry0"/></tuple>
<tuple><atom label="Dir0"/><atom label="Entry1"/></tuple>
<tuple><atom label="Dir1"/><atom label="Entry2"/></tuple>
<types> <type ID="5"/><type ID="7"/> </types>
</field>
<field label="object" ID="9" parentID="7">
<tuple><atom label="Entry0"/><atom label="Dir1"/></tuple>
<tuple><atom label="Entry1"/><atom label="File0"/></tuple>
<tuple><atom label="Entry2"/><atom label="File1"/></tuple>
<types> <type ID="7"/><type ID="4"/> </types>
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

  const constraintSelector = (patch: {
    constraints?: Record<string, unknown>[];
  }): string | undefined => {
    const constraint = patch.constraints?.[0] as any;
    return constraint?.orientation?.selector ?? constraint?.cyclic?.selector;
  };

  it('restricts each declaration of an overloaded field and never emits the bare name', async () => {
    const instance = load(OVERLOADED_FIELD_XML);
    const draft = suggestAlloyLayout(instance, { core });

    const synthesized = draft.suggestions.filter(
      ({ sourceRule }) => sourceRule === 'cope.selector-synthesis'
    );
    expect(synthesized).toHaveLength(2);
    const selectors = synthesized.map(({ patch }) => constraintSelector(patch)!);
    const aPart = asKeys([
      ['A0', 'A1'],
      ['A1', 'A2']
    ]);
    const bPart = asKeys([['B0', 'B1']]);
    expect(
      selectors.some((selector) =>
        setsEqual(evaluatePairs(instance, selector), aPart)
      )
    ).toBe(true);
    expect(
      selectors.some((selector) =>
        setsEqual(evaluatePairs(instance, selector), bPart)
      )
    ).toBe(true);

    // The bare overloaded name denotes the union of both declarations, so no
    // primary constraint may use it.
    for (const item of draft.suggestions) {
      for (const constraint of item.patch.constraints ?? []) {
        const selector = constraintSelector({ constraints: [constraint] });
        expect(selector).not.toBe('f');
      }
    }

    const validated = await resolveValidatedLayout(draft, (spec) =>
      validateCndSpecWithSpytial(spec, [instance], core)
    );
    for (const item of synthesized) {
      const decision = validated.decisions.find(
        ({ suggestionId }) => suggestionId === item.id
      );
      expect(decision?.outcome).toBe('applied');
    }
  });

  it('keeps the restriction even when the sibling overload is empty here', () => {
    // The bare name f verifies extensionally on THIS instance (B's f is
    // empty), but the schema says it is overloaded, so the emitted selector
    // must stay restricted rather than adopt the cheaper bare name.
    const instance = load(OVERLOADED_EMPTY_SIBLING_XML);
    const draft = suggestAlloyLayout(instance, { core });
    const synthesized = draft.suggestions.filter(
      ({ sourceRule }) => sourceRule === 'cope.selector-synthesis'
    );
    expect(synthesized).toHaveLength(1);
    const selector = constraintSelector(synthesized[0]!.patch)!;
    expect(selector).not.toBe('f');
    expect(selector).toContain('&');
    expect(evaluatePairs(instance, selector)).toEqual(
      asKeys([
        ['A0', 'A1'],
        ['A1', 'A2']
      ])
    );
  });

  it('narrows a supertype field to the subtype families where it is clean', async () => {
    const instance = load(NARROWED_FIELD_XML);
    const draft = suggestAlloyLayout(instance, { core });

    const synthesized = draft.suggestions.filter(
      ({ sourceRule }) => sourceRule === 'cope.selector-synthesis'
    );
    expect(synthesized).toHaveLength(2);

    const chain = synthesized.find(({ patch }) =>
      Boolean((patch.constraints?.[0] as any)?.orientation)
    );
    const ring = synthesized.find(({ patch }) =>
      Boolean((patch.constraints?.[0] as any)?.cyclic)
    );
    expect(chain).toBeDefined();
    expect(ring).toBeDefined();
    expect(
      evaluatePairs(instance, constraintSelector(chain!.patch)!)
    ).toEqual(
      asKeys([
        ['Item0', 'Item1'],
        ['Item1', 'Item2']
      ])
    );
    expect(evaluatePairs(instance, constraintSelector(ring!.patch)!)).toEqual(
      asKeys([
        ['Ghost0', 'Ghost1'],
        ['Ghost1', 'Ghost2'],
        ['Ghost2', 'Ghost0']
      ])
    );

    const validated = await resolveValidatedLayout(draft, (spec) =>
      validateCndSpecWithSpytial(spec, [instance], core)
    );
    for (const item of synthesized) {
      const decision = validated.decisions.find(
        ({ suggestionId }) => suggestionId === item.id
      );
      expect(decision?.outcome).toBe('applied');
    }
  });

  it('composes an indirection join into a single tree spine', async () => {
    const instance = load(INDIRECTION_XML);
    const draft = suggestAlloyLayout(instance, { core });

    const synthesized = draft.suggestions.filter(
      ({ sourceRule }) => sourceRule === 'cope.selector-synthesis'
    );
    expect(synthesized).toHaveLength(1);
    const selector = constraintSelector(synthesized[0]!.patch)!;
    expect(evaluatePairs(instance, selector)).toEqual(
      asKeys([
        ['Dir0', 'Dir1'],
        ['Dir0', 'File0'],
        ['Dir1', 'File1']
      ])
    );
    // The weaker fallback keeps both declared fields as separate spines.
    expect(synthesized[0]!.fallbacks[0]?.constraints).toHaveLength(2);

    const validated = await resolveValidatedLayout(draft, (spec) =>
      validateCndSpecWithSpytial(spec, [instance], core)
    );
    const decision = validated.decisions.find(
      ({ suggestionId }) => suggestionId === synthesized[0]!.id
    );
    expect(decision?.outcome).toBe('applied');
  });

  it('keeps restriction selectors invariant under atom renaming', () => {
    const renamedXml = OVERLOADED_FIELD_XML.replace(/A(\d)/g, 'Zeta9$1');
    const selectorsOf = (xml: string) =>
      suggestAlloyLayout(load(xml), { core })
        .suggestions.filter(
          ({ sourceRule }) => sourceRule === 'cope.selector-synthesis'
        )
        .map(({ patch }) => constraintSelector(patch))
        .sort();
    expect(selectorsOf(renamedXml)).toEqual(selectorsOf(OVERLOADED_FIELD_XML));
  });
});

function setsEqual(left: Set<string>, right: Set<string>): boolean {
  return left.size === right.size && [...left].every((key) => right.has(key));
}
