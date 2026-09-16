/** @jest-environment jsdom */

import { beforeAll, describe, expect, it } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { validateCndSpecWithSpytial } from '../layoutSuggestions';
import {
  applyProjectionTransform,
  topologicalSortWithCycleBreaking
} from '../projectionTransform';
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

// `next` orders the states State1 -> State0 -> State2, deliberately not lexicographic.
const XML = `<alloy builddate="test">
<instance bitwidth="4" maxseq="-1" command="test" filename="test.frg">
<sig label="seq/Int" ID="0" parentID="1" builtin="yes"></sig>
<sig label="Int" ID="1" parentID="2" builtin="yes"></sig>
<sig label="univ" ID="2" builtin="yes"></sig>
<sig label="State" ID="4" parentID="2">
<atom label="State0"/><atom label="State1"/><atom label="State2"/>
</sig>
<sig label="Node" ID="5" parentID="2">
<atom label="Node0"/><atom label="Node1"/>
</sig>
<field label="next" ID="6" parentID="4">
<tuple><atom label="State1"/><atom label="State0"/></tuple>
<tuple><atom label="State0"/><atom label="State2"/></tuple>
<types> <type ID="4"/><type ID="4"/> </types>
</field>
<field label="edge" ID="7" parentID="5">
<tuple><atom label="Node0"/><atom label="Node1"/><atom label="State1"/></tuple>
<tuple><atom label="Node1"/><atom label="Node0"/><atom label="State2"/></tuple>
<types> <type ID="5"/><type ID="5"/><type ID="4"/> </types>
</field>
<field label="link" ID="8" parentID="5">
<tuple><atom label="Node0"/><atom label="Node1"/></tuple>
<types> <type ID="5"/><type ID="5"/> </types>
</field>
</instance>
</alloy>`;

describe('projection on the installed spytial-core', () => {
  let core: SpytialCoreApi;
  let data: any;
  let orderBy: (selector: string) => string[][];

  beforeAll(() => {
    core = installedSpytialCore();
    const parsed = core.AlloyInstance.parseAlloyXML(XML);
    data = new core.AlloyDataInstance(parsed.instances[0]);
    const evaluator = new core.SGraphQueryEvaluator();
    evaluator.initialize({ sourceData: data });
    orderBy = (selector) => evaluator.evaluate(selector).selectedTwoples();
  });

  it('orders the choices by orderBy and defaults the selection to the first atom', () => {
    const selections: Record<string, string> = {};
    const { choices } = applyProjectionTransform(
      core,
      data,
      [{ sig: 'State', orderBy: 'next' }],
      selections,
      { evaluateOrderBy: orderBy }
    );

    expect(choices).toEqual([
      { type: 'State', projectedAtom: 'State1', atoms: ['State1', 'State0', 'State2'] }
    ]);
    expect(selections).toEqual({ State: 'State1' });
  });

  it('removes the projected atoms and collapses relations to the selected atom', () => {
    const { instance } = applyProjectionTransform(
      core,
      data,
      [{ sig: 'State' }],
      { State: 'State2' }
    );

    const atomIds = instance.getAtoms().map((a: { id: string }) => a.id);
    expect(atomIds).toEqual(expect.arrayContaining(['Node0', 'Node1']));
    expect(atomIds.filter((id: string) => id.startsWith('State'))).toEqual([]);

    const edge = instance.getRelations().find((r: { name: string }) => r.name === 'edge');
    expect(edge.tuples.map((t: { atoms: string[] }) => t.atoms)).toEqual([['Node1', 'Node0']]);
    expect(typeof instance.getAlloyInstance).toBe('function');
  });

  it('falls back to lexicographic order and reports it when orderBy fails', () => {
    const errors: string[] = [];
    const { choices } = applyProjectionTransform(
      core,
      data,
      [{ sig: 'State', orderBy: 'bogus' }],
      {},
      {
        evaluateOrderBy: () => {
          throw new Error('bad selector');
        },
        onOrderByError: (selector) => errors.push(selector)
      }
    );

    expect(errors).toEqual(['bogus']);
    expect(choices[0].atoms).toEqual(['State0', 'State1', 'State2']);
  });

  it('rejects a projected type the instance does not have', () => {
    expect(() =>
      applyProjectionTransform(core, data, [{ sig: 'Missing' }], {})
    ).toThrow("Projected type 'Missing' not found in data instance");
  });

  it('validates a projected spec through the real layout pipeline', () => {
    // Selectors still evaluate on the un-projected instance, so the constraint names a
    // relation without State atoms (a ternary `edge` would reference a projected-away State).
    const spec = [
      'projections:',
      '  - sig: State',
      '    orderBy: next',
      'constraints:',
      '  - orientation:',
      '      selector: link',
      '      directions: [directlyRight]'
    ].join('\n');

    expect(validateCndSpecWithSpytial(spec, [data], core)).toEqual({ valid: true });
  });
});

describe('topologicalSortWithCycleBreaking', () => {
  it('respects the partial order and places unordered atoms lexicographically', () => {
    expect(
      topologicalSortWithCycleBreaking(['c', 'orphan', 'b', 'a'], [['c', 'b'], ['b', 'a']])
    ).toEqual(['c', 'b', 'a', 'orphan']);
  });

  it('breaks a cycle at the lexicographically smallest atom', () => {
    expect(
      topologicalSortWithCycleBreaking(['b', 'c', 'a'], [['a', 'b'], ['b', 'c'], ['c', 'a']])
    ).toEqual(['a', 'b', 'c']);
  });

  it('ignores self-loops and pairs naming unknown atoms', () => {
    expect(
      topologicalSortWithCycleBreaking(['b', 'a'], [['a', 'a'], ['x', 'a'], ['b', 'a']])
    ).toEqual(['b', 'a']);
  });
});
