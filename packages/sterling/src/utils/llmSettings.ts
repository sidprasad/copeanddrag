/**
 * Persistence for the user's LLM connection (Describe Layout feature).
 *
 * Same pattern as theme/colorMode.ts: localStorage, try/catch guarded for
 * private mode / non-DOM environments. The key is stored UNENCRYPTED in this
 * browser only and is sent directly from the browser to the configured
 * endpoint — the UI states this next to the field. This is the app-side edge
 * of the seam: the nlAuthoring engine itself never touches storage.
 */

import type { LlmProviderConfig } from '../nlAuthoring';

const STORAGE_KEY = 'ccd-llm-config';

export function isLlmProviderConfig(value: unknown): value is LlmProviderConfig {
  if (typeof value !== 'object' || value === null) return false;
  const config = value as Record<string, unknown>;
  if (typeof config.model !== 'string' || typeof config.apiKey !== 'string') {
    return false;
  }
  if (config.kind === 'openai-compatible') {
    return typeof config.baseUrl === 'string' && config.baseUrl.length > 0;
  }
  return config.kind === 'anthropic';
}

export function loadLlmConfig(): LlmProviderConfig | undefined {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return undefined;
    const parsed: unknown = JSON.parse(stored);
    return isLlmProviderConfig(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export function saveLlmConfig(config: LlmProviderConfig): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    /* ignore */
  }
}

export function clearLlmConfig(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
