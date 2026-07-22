import { describe, expect, it, jest } from '@jest/globals';
import {
  NlProviderError,
  asProvider,
  extractJson,
  fromTextTransport,
  withJsonInstruction
} from '../providers';
import type { LlmMessage } from '../types';

const SCHEMA = { type: 'object' } as Record<string, unknown>;

describe('extractJson', () => {
  it('parses a bare JSON object', () => {
    expect(extractJson('{"a": 1}')).toEqual({ a: 1 });
  });

  it('parses a fenced ```json block', () => {
    expect(extractJson('```json\n{"a": 1}\n```')).toEqual({ a: 1 });
  });

  it('parses a fenced block without a language tag', () => {
    expect(extractJson('```\n{"a": 1}\n```')).toEqual({ a: 1 });
  });

  it('finds the first balanced object inside prose', () => {
    expect(
      extractJson('Sure! Here is the result:\n{"a": {"b": 2}}\nHope that helps.')
    ).toEqual({ a: { b: 2 } });
  });

  it('is not fooled by braces inside strings', () => {
    expect(extractJson('prefix {"a": "curly } brace", "b": 1} suffix')).toEqual({
      a: 'curly } brace',
      b: 1
    });
  });

  it('throws NlProviderError when no object is present', () => {
    expect(() => extractJson('no json here')).toThrow(NlProviderError);
  });

  it('rejects a top-level array', () => {
    expect(() => extractJson('[1, 2]')).toThrow(NlProviderError);
  });
});

describe('withJsonInstruction', () => {
  it('appends the schema to the final user message', () => {
    const messages: LlmMessage[] = [
      { role: 'system', content: 'sys' },
      { role: 'user', content: 'intent' }
    ];
    const result = withJsonInstruction(messages, SCHEMA);
    expect(result).toHaveLength(2);
    expect(result[1]!.content).toContain('intent');
    expect(result[1]!.content).toContain('JSON Schema');
    expect(result[1]!.content).toContain('"type":"object"');
    // The input is not mutated.
    expect(messages[1]!.content).toBe('intent');
  });

  it('adds a user message when the conversation ends with the assistant', () => {
    const messages: LlmMessage[] = [
      { role: 'user', content: 'intent' },
      { role: 'assistant', content: 'reply' }
    ];
    const result = withJsonInstruction(messages, SCHEMA);
    expect(result).toHaveLength(3);
    expect(result[2]!.role).toBe('user');
  });
});

describe('fromTextTransport', () => {
  it('instructs with the schema and parses the textual reply', async () => {
    const transport = jest.fn(async (messages: readonly LlmMessage[]) => {
      expect(messages[messages.length - 1]!.content).toContain('JSON Schema');
      return '```json\n{"ok": true}\n```';
    });
    const provider = fromTextTransport(transport);
    await expect(
      provider([{ role: 'user', content: 'hi' }], { schema: SCHEMA })
    ).resolves.toEqual({ ok: true });
  });
});

describe('asProvider', () => {
  it('passes a callable through unchanged', () => {
    const callable = async () => ({});
    expect(asProvider(callable)).toBe(callable);
  });
});
