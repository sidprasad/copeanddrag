import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { NlProviderError, createFetchProvider } from '../providers';
import type { LlmMessage } from '../types';

const MESSAGES: LlmMessage[] = [
  { role: 'system', content: 'sys' },
  { role: 'user', content: 'intent' }
];
const SCHEMA = { type: 'object' } as Record<string, unknown>;

function mockFetchOnce(status: number, body: unknown): jest.Mock {
  const mock = jest.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body)
  }));
  (globalThis as { fetch?: unknown }).fetch = mock;
  return mock;
}

afterEach(() => {
  delete (globalThis as { fetch?: unknown }).fetch;
});

describe('openai-compatible provider', () => {
  it('POSTs chat-completions with bearer auth and parses the reply', async () => {
    const mock = mockFetchOnce(200, {
      choices: [{ message: { content: '```json\n{"ok": 1}\n```' } }]
    });
    const provider = createFetchProvider({
      kind: 'openai-compatible',
      baseUrl: 'https://api.openai.com/v1/',
      apiKey: 'sk-test',
      model: 'gpt-test'
    });
    await expect(provider(MESSAGES, { schema: SCHEMA })).resolves.toEqual({
      ok: 1
    });

    const [url, init] = mock.mock.calls[0]! as [string, RequestInit];
    expect(url).toBe('https://api.openai.com/v1/chat/completions');
    expect((init.headers as Record<string, string>).Authorization).toBe(
      'Bearer sk-test'
    );
    const body = JSON.parse(init.body as string);
    expect(body.model).toBe('gpt-test');
    expect(body.messages).toHaveLength(2);
    // The schema instruction is embedded in the final user message.
    expect(body.messages[1].content).toContain('JSON Schema');
  });

  it('omits the Authorization header for keyless local endpoints', async () => {
    const mock = mockFetchOnce(200, {
      choices: [{ message: { content: '{}' } }]
    });
    const provider = createFetchProvider({
      kind: 'openai-compatible',
      baseUrl: 'http://localhost:11434/v1',
      apiKey: '',
      model: 'llama3.2'
    });
    await provider(MESSAGES, { schema: SCHEMA });
    const [, init] = mock.mock.calls[0]! as [string, RequestInit];
    expect(
      (init.headers as Record<string, string>).Authorization
    ).toBeUndefined();
  });

  it('maps HTTP errors to NlProviderError with the status', async () => {
    mockFetchOnce(401, { error: 'bad key' });
    const provider = createFetchProvider({
      kind: 'openai-compatible',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: 'sk-bad',
      model: 'gpt-test'
    });
    await expect(provider(MESSAGES, { schema: SCHEMA })).rejects.toThrow(
      /401/
    );
    await expect(
      provider(MESSAGES, { schema: SCHEMA }).catch((error) => error)
    ).resolves.toBeInstanceOf(NlProviderError);
  });
});

describe('anthropic provider', () => {
  it('extracts system to the top level and sends browser-access headers', async () => {
    const mock = mockFetchOnce(200, {
      content: [{ type: 'text', text: '{"ok": 2}' }]
    });
    const provider = createFetchProvider({
      kind: 'anthropic',
      apiKey: 'sk-ant-test',
      model: 'claude-test'
    });
    await expect(provider(MESSAGES, { schema: SCHEMA })).resolves.toEqual({
      ok: 2
    });

    const [url, init] = mock.mock.calls[0]! as [string, RequestInit];
    expect(url).toBe('https://api.anthropic.com/v1/messages');
    const headers = init.headers as Record<string, string>;
    expect(headers['x-api-key']).toBe('sk-ant-test');
    expect(headers['anthropic-version']).toBe('2023-06-01');
    expect(headers['anthropic-dangerous-direct-browser-access']).toBe('true');
    const body = JSON.parse(init.body as string);
    expect(body.system).toBe('sys');
    expect(body.max_tokens).toBe(4096);
    expect(
      body.messages.every(({ role }: { role: string }) => role !== 'system')
    ).toBe(true);
  });

  it('rejects when the response has no text content', async () => {
    mockFetchOnce(200, { content: [] });
    const provider = createFetchProvider({
      kind: 'anthropic',
      apiKey: 'k',
      model: 'm'
    });
    await expect(provider(MESSAGES, { schema: SCHEMA })).rejects.toThrow(
      NlProviderError
    );
  });
});
