/**
 * The provider slot for NL layout authoring.
 *
 * Mirrors spytial-py's spytial/suggest/providers.py: a provider is a callable
 * (messages, {schema}) -> Promise<object>. This file supplies the resolution
 * sugar (asProvider), the helpers text-only backends lean on (schema
 * instruction injection + tolerant JSON extraction), and browser-callable
 * fetch adapters for OpenAI-compatible and Anthropic endpoints.
 *
 * The fetch adapters deliberately do NOT use vendor structured-output modes
 * (response_format json_schema and friends): support varies wildly across the
 * OpenAI-compatible ecosystem (Ollama, LM Studio, OpenRouter, Groq, ...), and
 * the engine's parse/vocabulary gates plus its repair loop already handle a
 * malformed reply. Embedding the schema in the prompt is the one mechanism
 * that works everywhere.
 */

import type { LlmMessage, NlProvider } from './types';

/** A provider could not be built or a provider call failed. */
export class NlProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NlProviderError';
  }
}

/** A raw text backend: the whole conversation in, the model's text out. */
export type NlTextTransport = (
  messages: readonly LlmMessage[]
) => Promise<string>;

export type LlmProviderConfig =
  | {
      kind: 'openai-compatible';
      /** Endpoint base, e.g. https://api.openai.com/v1 or http://localhost:11434/v1 */
      baseUrl: string;
      /** Bearer token; empty is fine for local servers. */
      apiKey: string;
      model: string;
    }
  | {
      kind: 'anthropic';
      apiKey: string;
      model: string;
      /** Anthropic requires an explicit cap; default 4096. */
      maxTokens?: number;
    };

/**
 * Append a strict "reply with only this JSON" instruction to the final user
 * message. For backends without a native schema mode; pair with extractJson.
 */
export function withJsonInstruction(
  messages: readonly LlmMessage[],
  schema: Record<string, unknown>
): LlmMessage[] {
  const instruction =
    'Respond with ONLY a single JSON object conforming to this JSON Schema. ' +
    'No prose, no explanation, no markdown code fence.\n\n' +
    `JSON Schema:\n${JSON.stringify(schema)}`;
  const result = messages.map((message) => ({ ...message }));
  const last = result[result.length - 1];
  if (last && last.role === 'user') {
    last.content = `${last.content}\n\n${instruction}`;
  } else {
    result.push({ role: 'user', content: instruction });
  }
  return result;
}

/**
 * Parse a JSON object out of model output, tolerating code fences and stray
 * prose: the whole string first, then the first balanced {...} anywhere.
 * Throws NlProviderError when nothing parseable is found.
 */
export function extractJson(text: string): Record<string, unknown> {
  let s = text.trim();
  if (s.startsWith('```')) {
    s = s.replace(/^`+/, '').replace(/`+$/, '');
    if (s.toLowerCase().startsWith('json')) {
      s = s.slice(4);
    }
    s = s.trim();
  }
  try {
    const parsed = JSON.parse(s);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // fall through to balanced-object scan
  }
  const start = s.indexOf('{');
  if (start !== -1) {
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let i = start; i < s.length; i++) {
      const ch = s[i];
      if (inString) {
        if (escaped) escaped = false;
        else if (ch === '\\') escaped = true;
        else if (ch === '"') inString = false;
        continue;
      }
      if (ch === '"') inString = true;
      else if (ch === '{') depth += 1;
      else if (ch === '}') {
        depth -= 1;
        if (depth === 0) {
          try {
            return JSON.parse(s.slice(start, i + 1)) as Record<string, unknown>;
          } catch {
            break;
          }
        }
      }
    }
  }
  throw new NlProviderError(
    `no JSON object found in model output: ${JSON.stringify(text.slice(0, 200))}`
  );
}

/** Wrap a raw text backend into a provider: instruct with the schema, parse the reply. */
export function fromTextTransport(transport: NlTextTransport): NlProvider {
  return async (messages, { schema }) =>
    extractJson(await transport(withJsonInstruction(messages, schema)));
}

async function readErrorBody(response: Response): Promise<string> {
  try {
    return (await response.text()).slice(0, 300);
  } catch {
    return '';
  }
}

function openAiCompatibleTransport(
  config: Extract<LlmProviderConfig, { kind: 'openai-compatible' }>
): NlTextTransport {
  return async (messages) => {
    const response = await fetch(
      `${config.baseUrl.replace(/\/+$/, '')}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey
            ? { Authorization: `Bearer ${config.apiKey}` }
            : {})
        },
        body: JSON.stringify({
          model: config.model,
          messages: messages.map(({ role, content }) => ({ role, content }))
        })
      }
    );
    if (!response.ok) {
      throw new NlProviderError(
        `LLM endpoint returned ${response.status}: ${await readErrorBody(response)}`
      );
    }
    const body = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = body.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      throw new NlProviderError('LLM response had no message content.');
    }
    return content;
  };
}

function anthropicTransport(
  config: Extract<LlmProviderConfig, { kind: 'anthropic' }>
): NlTextTransport {
  return async (messages) => {
    // Anthropic takes the system prompt as a top-level param, not a message.
    const system = messages
      .filter(({ role }) => role === 'system')
      .map(({ content }) => content)
      .join('\n\n');
    const conversation = messages.filter(({ role }) => role !== 'system');
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: config.maxTokens ?? 4096,
        ...(system ? { system } : {}),
        messages: conversation.map(({ role, content }) => ({ role, content }))
      })
    });
    if (!response.ok) {
      throw new NlProviderError(
        `Anthropic returned ${response.status}: ${await readErrorBody(response)}`
      );
    }
    const body = (await response.json()) as {
      content?: Array<{ type?: string; text?: string }>;
    };
    const text = (body.content ?? [])
      .filter((block) => block.type === 'text' && typeof block.text === 'string')
      .map((block) => block.text)
      .join('');
    if (!text) {
      throw new NlProviderError('Anthropic response had no text content.');
    }
    return text;
  };
}

/** Build a browser-callable provider from a stored endpoint configuration. */
export function createFetchProvider(config: LlmProviderConfig): NlProvider {
  switch (config.kind) {
    case 'openai-compatible':
      return fromTextTransport(openAiCompatibleTransport(config));
    case 'anthropic':
      return fromTextTransport(anthropicTransport(config));
    default: {
      const exhaustive: never = config;
      throw new NlProviderError(
        `Unknown provider kind: ${JSON.stringify(exhaustive)}`
      );
    }
  }
}

/** Resolve a provider slot value: a callable is used as-is, a config builds a fetch provider. */
export function asProvider(spec: NlProvider | LlmProviderConfig): NlProvider {
  if (typeof spec === 'function') return spec;
  return createFetchProvider(spec);
}
