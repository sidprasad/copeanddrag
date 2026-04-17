import { mockClick, mockData, mockEval, mockMeta } from './mockPayloads';

/**
 * A drop-in replacement for the subset of the WebSocket API used by
 * sterlingConnectionMiddleware. Answers `meta`, `data`, and `eval` requests
 * with canned payloads so the app can run without a live provider.
 *
 * All transitions fire asynchronously (via setTimeout) to match real
 * WebSocket timing — a real socket never fires close/open/message
 * synchronously from a method call. Matching that timing keeps the
 * middleware's closure state consistent under React StrictMode's
 * double-mount (which calls connect → disconnect → connect synchronously).
 */
export class MockWebSocketLike {
  readyState: number = WebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;

  constructor() {
    setTimeout(() => {
      if (this.readyState !== WebSocket.CONNECTING) return;
      this.readyState = WebSocket.OPEN;
      this.onopen?.();
    }, 0);
  }

  send(raw: string): void {
    if (this.readyState !== WebSocket.OPEN) return;
    if (raw === 'ping') return this.reply('pong');
    let msg: { type?: string; payload?: any };
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    if (msg.type === 'meta') return this.reply(JSON.stringify(mockMeta()));
    if (msg.type === 'data') return this.reply(JSON.stringify(mockData()));
    if (msg.type === 'eval') return this.reply(JSON.stringify(mockEval(msg.payload)));
    if (msg.type === 'click') return this.reply(JSON.stringify(mockClick(msg.payload)));
  }

  close(): void {
    if (this.readyState === WebSocket.CLOSED || this.readyState === WebSocket.CLOSING) return;
    this.readyState = WebSocket.CLOSING;
    setTimeout(() => {
      this.readyState = WebSocket.CLOSED;
      this.onclose?.();
    }, 0);
  }

  private reply(data: string): void {
    setTimeout(() => {
      if (this.readyState !== WebSocket.OPEN) return;
      this.onmessage?.({ data });
    }, 0);
  }
}
