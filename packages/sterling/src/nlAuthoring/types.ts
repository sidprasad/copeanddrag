/**
 * The seam types for natural-language layout authoring.
 *
 * Everything in this directory is host-agnostic: no React, no Redux, no
 * window/localStorage. The host injects an LLM provider, a spytial-core API
 * object, and data instances; the engine returns validated candidates. This
 * keeps the module liftable into spytial-core (or a sibling package) so other
 * hosts — e.g. the VS Code extension, which embeds core rather than this app —
 * can reuse it by implementing NlProvider alone.
 */

import type {
  CndPatch,
  RawAlloyInstance,
  SpytialDataInstance,
  SuggestionConfidence
} from '../utils/layoutSuggestions';
import type { SpytialCoreApi } from '../utils/spytialCore';

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * The provider slot, mirroring spytial-py's EnrichProvider contract
 * ((prompt, *, schema) -> dict) in message-list form: given a conversation and
 * a JSON schema for the reply, return the structured reply object.
 *
 * Anything with this shape works — a fetch adapter, a test stub, or a
 * host-specific bridge (VS Code's language-model API, a local CLI proxy).
 * Backends without native structured output lean on fromTextTransport(), which
 * injects the schema into the prompt and parses the reply tolerantly. A
 * provider is free to throw; the engine catches and reports status 'failed'
 * rather than crashing.
 */
export type NlProvider = (
  messages: readonly LlmMessage[],
  options: { schema: Record<string, unknown> }
) => Promise<unknown>;

/** One candidate translation as the model reports it. */
export interface NlLlmCandidate {
  rationale: string;
  confidence: SuggestionConfidence;
  patch: CndPatch;
  /** Weaker forms, strongest first, tried if the primary patch fails. */
  fallbacks?: CndPatch[];
}

/** The JSON object the model must reply with. */
export interface NlLlmResponse {
  /** One-sentence restatement of how the utterance was understood. */
  interpretation: string;
  /**
   * A question back to the user when the utterance is ambiguous. When set,
   * candidates may be empty and the engine short-circuits to
   * status 'needsClarification'.
   */
  clarification?: string | null;
  candidates: NlLlmCandidate[];
}

/**
 * A problem found in a candidate (or the response as a whole) by one of the
 * validation stages. Findings are both repair feedback (serialized back to
 * the model) and, for warnings that survive, preview annotations.
 */
export interface NlFinding {
  /** Index into the response's candidates, or -1 for response-level issues. */
  candidateIndex: number;
  /** blocking: must be repaired or the candidate is dropped. warning: shown, survivable. */
  severity: 'blocking' | 'warning';
  stage: 'shape' | 'vocabulary' | 'static' | 'evaluation' | 'layout';
  message: string;
}

export interface NlProgressEvent {
  kind: 'llm-call' | 'validating' | 'repairing' | 'salvaging';
  message: string;
}

export interface NlAuthoringRequest {
  /** The user's natural-language layout intent. */
  utterance: string;
  /** Full CnD YAML currently in the editor; '' when starting fresh. */
  currentSpec: string;
  /** Resume transcript after answering a clarification question. */
  priorTranscript?: LlmMessage[];
}

export interface NlEngineOptions {
  /** Total provider calls allowed: 1 translate + (n-1) repairs. Default 3. */
  maxLlmCalls?: number;
}

export interface NlEngineDeps {
  provider: NlProvider;
  core: SpytialCoreApi;
  /** One AlloyDataInstance per state of the active datum. */
  instances: readonly SpytialDataInstance[];
  /** Source-declaration metadata (abstract/one/enum) for schema grounding. */
  rawInstance?: RawAlloyInstance;
  onProgress?: (event: NlProgressEvent) => void;
  options?: NlEngineOptions;
}

/** A candidate after validation and the mechanical-salvage pass. */
export interface NlValidatedCandidate {
  rationale: string;
  confidence: SuggestionConfidence;
  /** The patch variant that survived (primary or a fallback). */
  patch: CndPatch;
  /** yaml.dump of `patch`, for display. */
  renderedYaml: string;
  decision: 'applied' | 'weakened' | 'omitted';
  decisionReason?: string;
  /** Surviving warning-severity findings (e.g. "matches nothing"). */
  warnings: string[];
}

export interface NlAuthoringResult {
  status: 'ok' | 'needsClarification' | 'failed';
  /** The model's restatement of the intent (when a response was obtained). */
  interpretation?: string;
  /** The clarification question, when status is 'needsClarification'. */
  question?: string;
  /** Full conversation so far; pass back as priorTranscript to resume. */
  transcript: LlmMessage[];
  candidates: NlValidatedCandidate[];
  /** currentSpec merged with every applied/weakened candidate. */
  mergedSpec?: string;
  /** Human-readable notes: budget exhaustion, provider errors, etc. */
  diagnostics: string[];
  llmCallsUsed: number;
}
