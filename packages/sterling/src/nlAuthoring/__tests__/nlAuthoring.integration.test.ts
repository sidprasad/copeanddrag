/** @jest-environment jsdom */

/**
 * End-to-end engine tests against the INSTALLED spytial-core bundle: real
 * parser, real evaluator, real layout solver — only the LLM is canned.
 */

import { beforeAll, describe, expect, it, jest } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { validateCndSpecWithSpytial } from '../../utils/layoutSuggestions';
import type { SpytialDataInstance } from '../../utils/layoutSuggestions';
import type { SpytialCoreApi } from '../../utils/spytialCore';
import { translateLayoutIntent } from '../engine';
import { collectPatchFindings } from '../oracles';
import type { LlmMessage, NlEngineDeps } from '../types';

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

/** A two-state binary tree datum in the shape of demos/bst. */
const BST_XML = `<alloy builddate="test">
<instance bitwidth="4" maxseq="-1" command="test" filename="bst.frg">
<sig label="seq/Int" ID="0" parentID="1" builtin="yes"></sig>
<sig label="Int" ID="1" parentID="2" builtin="yes"></sig>
<sig label="univ" ID="2" builtin="yes"></sig>
<sig label="Tree" ID="4" parentID="2">
<atom label="Tree0"/><atom label="Tree1"/><atom label="Tree2"/>
</sig>
<field label="left" ID="5" parentID="4">
<tuple><atom label="Tree0"/><atom label="Tree1"/></tuple>
<types> <type ID="4"/><type ID="4"/> </types>
</field>
<field label="right" ID="6" parentID="4">
<tuple><atom label="Tree0"/><atom label="Tree2"/></tuple>
<types> <type ID="4"/><type ID="4"/> </types>
</field>
</instance>
<instance bitwidth="4" maxseq="-1" command="test" filename="bst.frg">
<sig label="seq/Int" ID="0" parentID="1" builtin="yes"></sig>
<sig label="Int" ID="1" parentID="2" builtin="yes"></sig>
<sig label="univ" ID="2" builtin="yes"></sig>
<sig label="Tree" ID="4" parentID="2">
<atom label="Tree0"/><atom label="Tree1"/>
</sig>
<field label="left" ID="5" parentID="4">
<types> <type ID="4"/><type ID="4"/> </types>
</field>
<field label="right" ID="6" parentID="4">
<tuple><atom label="Tree0"/><atom label="Tree1"/></tuple>
<types> <type ID="4"/><type ID="4"/> </types>
</field>
</instance>
</alloy>`;

const reply = (selector: string) => ({
  interpretation: 'Children should sit below their parents.',
  clarification: null,
  candidates: [
    {
      rationale: `${selector} pairs each parent with its children.`,
      confidence: 'high',
      patch: {
        constraints: [{ orientation: { selector, directions: ['above'] } }]
      }
    }
  ]
});

describe('NL authoring against the installed spytial-core', () => {
  let core: SpytialCoreApi;
  let instances: SpytialDataInstance[];

  beforeAll(() => {
    core = installedSpytialCore();
    window.spytialcore = core;
    const parsed = (core as any).AlloyInstance.parseAlloyXML(BST_XML);
    instances = parsed.instances.map(
      (instance: unknown) => new (core as any).AlloyDataInstance(instance)
    );
  });

  it('repairs a misspelled selector using real evaluator feedback', async () => {
    const provider = jest
      .fn<NlEngineDeps['provider']>()
      .mockResolvedValueOnce(reply('lft'))
      .mockResolvedValueOnce(reply('left + right'));

    const result = await translateLayoutIntent(
      { utterance: 'All binary tree children should be below their parents', currentSpec: '' },
      { provider, core, instances }
    );

    expect(result.status).toBe('ok');
    expect(result.llmCallsUsed).toBe(2);
    expect(result.candidates[0]!.decision).toBe('applied');

    // The repair message the model saw must carry the real oracle's reason.
    const secondCallMessages = provider.mock.calls[1]![0] as LlmMessage[];
    const repair = secondCallMessages[secondCallMessages.length - 1]!;
    expect(repair.role).toBe('user');
    expect(repair.content).toContain('lft');

    // The final merged spec passes the REAL pipeline on every state.
    expect(result.mergedSpec).toContain('left + right');
    expect(
      validateCndSpecWithSpytial(result.mergedSpec!, instances, core)
    ).toEqual({ valid: true });
  });

  it('static analysis pre-flights a provably empty selector without a solver run', () => {
    const findings = collectPatchFindings(
      0,
      {
        constraints: [
          { orientation: { selector: 'left & right', directions: ['above'] } }
        ]
      },
      { core, instances }
    );
    // left and right share no tuples here, but that is instance luck — the
    // static verdict must come from the analyzer only when PROVABLE. A
    // type-level disjoint pair is: Tree & Int... which is unary. Use the
    // difference-with-self form, provably empty for any instance.
    const provable = collectPatchFindings(
      0,
      {
        constraints: [
          { orientation: { selector: 'left - left', directions: ['above'] } }
        ]
      },
      { core, instances }
    );
    expect(
      provable.some(
        ({ stage, message }) => stage === 'static' && message.includes('empty')
      )
    ).toBe(true);
    // The instance-level intersection is caught at evaluation as a warning,
    // not statically.
    expect(findings.every(({ stage }) => stage !== 'static')).toBe(true);
  });

  it('flags a selector that is empty in every state as a warning', async () => {
    const provider = jest
      .fn<NlEngineDeps['provider']>()
      .mockResolvedValue(reply('left & right'));
    const result = await translateLayoutIntent(
      { utterance: 'overlap below', currentSpec: '' },
      { provider, core, instances, options: { maxLlmCalls: 1 } }
    );
    // Empty-match is soft: the candidate survives with a warning attached.
    expect(result.status).toBe('ok');
    expect(result.candidates[0]!.warnings.join(' ')).toContain('matches nothing');
  });

  it('omits a candidate that conflicts with the current spec, keeping the current spec intact', async () => {
    const currentSpec = [
      'constraints:',
      '  - orientation: {selector: left + right, directions: [above]}'
    ].join('\n');
    // The opposite direction on the same selector cannot co-hold.
    const provider = jest
      .fn<NlEngineDeps['provider']>()
      .mockResolvedValue(reply_below());
    function reply_below() {
      return {
        interpretation: 'Parents below children.',
        clarification: null,
        candidates: [
          {
            rationale: 'flip the tree upside down',
            confidence: 'high',
            patch: {
              constraints: [
                {
                  orientation: {
                    selector: 'left + right',
                    directions: ['below']
                  }
                }
              ]
            }
          }
        ]
      };
    }

    const result = await translateLayoutIntent(
      { utterance: 'put parents below children', currentSpec },
      { provider, core, instances, options: { maxLlmCalls: 1 } }
    );

    expect(result.status).toBe('failed');
    expect(result.candidates[0]!.decision).toBe('omitted');
    expect(result.candidates[0]!.decisionReason).toBeTruthy();
    // The conflict was described to the model in the loop's findings phase
    // via the layout stage before the budget ran out the repair.
    expect(result.diagnostics.join(' ')).toContain('No candidate survived');
  });
});
