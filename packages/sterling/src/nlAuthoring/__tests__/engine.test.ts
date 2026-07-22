import { describe, expect, it, jest } from '@jest/globals';
import { mechanicallyWeakened, translateLayoutIntent } from '../engine';
import type { LlmMessage, NlEngineDeps, NlProgressEvent } from '../types';
import { FAKE_INSTANCE, fakeCore } from '../testSupport/fakes';

const GOOD_REPLY = {
  interpretation: 'Children below parents.',
  clarification: null,
  candidates: [
    {
      rationale: 'left + right pairs each parent with its children.',
      confidence: 'high',
      patch: {
        constraints: [
          { orientation: { selector: 'left + right', directions: ['above'] } }
        ]
      }
    }
  ]
};

const BROKEN_SELECTOR_REPLY = {
  interpretation: 'Children below parents.',
  clarification: null,
  candidates: [
    {
      rationale: 'lft looks like the tree field.',
      confidence: 'high',
      patch: {
        constraints: [{ orientation: { selector: 'lft', directions: ['above'] } }]
      }
    }
  ]
};

function makeDeps(
  provider: NlEngineDeps['provider'],
  options?: NlEngineDeps['options']
): NlEngineDeps {
  return {
    provider,
    core: fakeCore(),
    instances: [FAKE_INSTANCE],
    ...(options ? { options } : {})
  };
}

const REQUEST = { utterance: 'children below parents', currentSpec: '' };

describe('translateLayoutIntent', () => {
  it('accepts a clean first reply and merges it', async () => {
    const provider = jest.fn(async () => GOOD_REPLY);
    const result = await translateLayoutIntent(REQUEST, makeDeps(provider));
    expect(result.status).toBe('ok');
    expect(result.llmCallsUsed).toBe(1);
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0]!.decision).toBe('applied');
    expect(result.mergedSpec).toContain('left + right');
    expect(result.interpretation).toContain('Children');
  });

  it('feeds oracle findings back and succeeds on the repaired reply', async () => {
    const provider = jest
      .fn<NlEngineDeps['provider']>()
      .mockResolvedValueOnce(BROKEN_SELECTOR_REPLY)
      .mockResolvedValueOnce(GOOD_REPLY);
    const result = await translateLayoutIntent(REQUEST, makeDeps(provider));
    expect(result.status).toBe('ok');
    expect(result.llmCallsUsed).toBe(2);

    // The second call's conversation must include a repair message carrying
    // the evaluator's complaint about `lft` verbatim.
    const secondCallMessages = provider.mock.calls[1]![0] as LlmMessage[];
    const repair = secondCallMessages[secondCallMessages.length - 1]!;
    expect(repair.role).toBe('user');
    expect(repair.content).toContain('lft');
    expect(repair.content).toContain('NameNotFoundError');
  });

  it('repairs a shape-invalid reply the same way', async () => {
    const provider = jest
      .fn<NlEngineDeps['provider']>()
      .mockResolvedValueOnce({ nonsense: true })
      .mockResolvedValueOnce(GOOD_REPLY);
    const result = await translateLayoutIntent(REQUEST, makeDeps(provider));
    expect(result.status).toBe('ok');
    expect(result.llmCallsUsed).toBe(2);
    const secondCallMessages = provider.mock.calls[1]![0] as LlmMessage[];
    expect(secondCallMessages[secondCallMessages.length - 1]!.content).toContain(
      'interpretation'
    );
  });

  it('reports a failed status when the provider throws', async () => {
    const provider = jest
      .fn<NlEngineDeps['provider']>()
      .mockRejectedValue(new Error('401 invalid key'));
    const result = await translateLayoutIntent(REQUEST, makeDeps(provider));
    expect(result.status).toBe('failed');
    expect(result.diagnostics.join(' ')).toContain('401 invalid key');
  });

  it('short-circuits on a clarification question with a resumable transcript', async () => {
    const provider = jest.fn(async () => ({
      interpretation: 'Ambiguous.',
      clarification: 'Which field forms the tree: left, right, or both?'
    }));
    const result = await translateLayoutIntent(REQUEST, makeDeps(provider));
    expect(result.status).toBe('needsClarification');
    expect(result.question).toContain('Which field');
    expect(result.transcript[result.transcript.length - 1]!.role).toBe(
      'assistant'
    );
  });

  it('resumes from a prior transcript with the answer as the next user turn', async () => {
    const provider = jest.fn(async (messages: readonly LlmMessage[]) => {
      expect(messages[messages.length - 1]!.content).toBe('both');
      return GOOD_REPLY;
    });
    const priorTranscript: LlmMessage[] = [
      { role: 'system', content: 'sys' },
      { role: 'user', content: 'Intent: "children below parents"' },
      { role: 'assistant', content: '{"clarification": "which field?"}' }
    ];
    const result = await translateLayoutIntent(
      { utterance: 'both', currentSpec: '', priorTranscript },
      makeDeps(provider)
    );
    expect(result.status).toBe('ok');
  });

  it('salvages via fallbacks when the budget runs out', async () => {
    const provider = jest.fn(async () => ({
      ...BROKEN_SELECTOR_REPLY,
      candidates: [
        {
          ...BROKEN_SELECTOR_REPLY.candidates[0],
          fallbacks: [
            {
              constraints: [
                { orientation: { selector: 'left', directions: ['above'] } }
              ]
            }
          ]
        }
      ]
    }));
    const result = await translateLayoutIntent(
      REQUEST,
      makeDeps(provider, { maxLlmCalls: 1 })
    );
    expect(result.llmCallsUsed).toBe(1);
    expect(result.status).toBe('ok');
    expect(result.candidates[0]!.decision).toBe('weakened');
    expect(result.mergedSpec).toContain('selector: left');
    expect(result.diagnostics.join(' ')).toContain('budget');
  });

  it('fails cleanly when nothing survives validation', async () => {
    const provider = jest.fn(async () => BROKEN_SELECTOR_REPLY);
    const result = await translateLayoutIntent(
      REQUEST,
      makeDeps(provider, { maxLlmCalls: 1 })
    );
    expect(result.status).toBe('failed');
    expect(result.candidates[0]!.decision).toBe('omitted');
    expect(result.diagnostics.join(' ')).toContain('No candidate survived');
  });

  it('emits progress events across phases', async () => {
    const events: NlProgressEvent[] = [];
    const provider = jest
      .fn<NlEngineDeps['provider']>()
      .mockResolvedValueOnce(BROKEN_SELECTOR_REPLY)
      .mockResolvedValueOnce(GOOD_REPLY);
    await translateLayoutIntent(REQUEST, {
      ...makeDeps(provider),
      onProgress: (event) => events.push(event)
    });
    const kinds = events.map(({ kind }) => kind);
    expect(kinds).toContain('llm-call');
    expect(kinds).toContain('validating');
    expect(kinds).toContain('repairing');
    expect(kinds).toContain('salvaging');
  });
});

describe('mechanicallyWeakened', () => {
  it('relaxes directly* and drops extra directions', () => {
    const weakened = mechanicallyWeakened({
      constraints: [
        {
          orientation: {
            selector: 'left',
            directions: ['directlyAbove', 'left']
          }
        }
      ]
    });
    expect(weakened?.constraints?.[0]).toEqual({
      orientation: { selector: 'left', directions: ['above'] }
    });
  });

  it('returns undefined when nothing can weaken', () => {
    expect(
      mechanicallyWeakened({
        constraints: [
          { orientation: { selector: 'left', directions: ['above'] } }
        ]
      })
    ).toBeUndefined();
  });
});
