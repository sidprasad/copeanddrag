/** @jest-environment jsdom */

import { beforeAll, describe, expect, it } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { getForgeStaticAnalyzer } from '../spytialCore';
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

const XML = `<alloy builddate="test">
<instance bitwidth="4" maxseq="-1" command="test" filename="test.frg">
<sig label="seq/Int" ID="0" parentID="1" builtin="yes"></sig>
<sig label="Int" ID="1" parentID="2" builtin="yes"></sig>
<sig label="univ" ID="2" builtin="yes"></sig>
<sig label="Node" ID="4" parentID="2">
<atom label="Node0"/><atom label="Node1"/>
</sig>
<sig label="Color" ID="5" parentID="2">
<atom label="Color0"/>
</sig>
<field label="left" ID="6" parentID="4">
<tuple><atom label="Node0"/><atom label="Node1"/></tuple>
<types> <type ID="4"/><type ID="4"/> </types>
</field>
</instance>
</alloy>`;

describe('static selector analysis on the installed spytial-core', () => {
  let core: SpytialCoreApi;
  let schema: any;

  beforeAll(() => {
    core = installedSpytialCore();
    const parsed = (core as any).AlloyInstance.parseAlloyXML(XML);
    schema = new (core as any).AlloyDataInstance(parsed.instances[0]);
  });

  it('is reachable through the Evaluators namespace', () => {
    expect(typeof getForgeStaticAnalyzer(core)).toBe('function');
  });

  it('flags a provably empty intersection with a reason', () => {
    const verdict = getForgeStaticAnalyzer(core)!('Node & Color', schema);
    expect(verdict).toEqual({
      status: 'empty',
      reason: expect.stringContaining('empty')
    });
  });

  it('flags an arity mismatch as ill-typed with a reason', () => {
    const verdict = getForgeStaticAnalyzer(core)!('left & Color', schema);
    expect(verdict.status).toBe('ill-typed');
    expect((verdict as any).reason).toMatch(/arity/);
  });

  it('does NOT catch unknown names — that is the evaluator stage’s job', () => {
    // The nlAuthoring oracle pipeline relies on this division: misspelled
    // selectors pass static analysis and must be caught by evaluation.
    expect(getForgeStaticAnalyzer(core)!('lft', schema)).toEqual({
      status: 'unknown'
    });
  });

  it('exposes the LLM-oriented schema serializers', () => {
    expect(core.generateAlloySchema!(schema)).toContain('sig Node');
    expect(core.generateTextDescription!(schema)).toMatch(
      /left: Node -> Node \(1 tuple\)/
    );
  });
});
