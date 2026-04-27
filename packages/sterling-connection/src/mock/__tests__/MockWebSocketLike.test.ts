/** @jest-environment jsdom */
import { describe, expect, it, jest } from '@jest/globals';
import { FIXTURES } from '../fixtures';
import { MockWebSocketLike } from '../MockWebSocketLike';

const flush = () => new Promise<void>((r) => setTimeout(r, 0));

describe('MockWebSocketLike', () => {
  it('fires onopen async and transitions readyState CONNECTING → OPEN', async () => {
    const ws = new MockWebSocketLike();
    expect(ws.readyState).toBe(WebSocket.CONNECTING);
    const onopen = jest.fn();
    ws.onopen = onopen;
    await flush();
    expect(onopen).toHaveBeenCalledTimes(1);
    expect(ws.readyState).toBe(WebSocket.OPEN);
  });

  it('responds to ping with pong', async () => {
    const ws = new MockWebSocketLike();
    const onmessage = jest.fn<(ev: { data: string }) => void>();
    ws.onmessage = onmessage;
    await flush();
    ws.send('ping');
    await flush();
    expect(onmessage).toHaveBeenCalledTimes(1);
    expect(onmessage.mock.calls[0][0]).toEqual({ data: 'pong' });
  });

  it('responds to a meta request with provider metadata advertising the rc generator', async () => {
    const ws = new MockWebSocketLike();
    const onmessage = jest.fn<(ev: { data: string }) => void>();
    ws.onmessage = onmessage;
    await flush();
    ws.send(JSON.stringify({ type: 'meta' }));
    await flush();
    const reply = JSON.parse(onmessage.mock.calls[0][0].data);
    expect(reply.type).toBe('meta');
    expect(reply.version).toBe(1);
    expect(reply.payload.evaluator).toBe('mock');
    expect(reply.payload.generators).toEqual(expect.arrayContaining(['rc']));
  });

  it('responds to a click on the rc generator with the rc fixture XML', async () => {
    const ws = new MockWebSocketLike();
    const onmessage = jest.fn<(ev: { data: string }) => void>();
    ws.onmessage = onmessage;
    await flush();
    ws.send(
      JSON.stringify({
        type: 'click',
        payload: { id: undefined, onClick: 'run', context: { generatorName: 'rc' } }
      })
    );
    await flush();
    const reply = JSON.parse(onmessage.mock.calls[0][0].data);
    expect(reply.type).toBe('data');
    expect(reply.payload.enter).toHaveLength(1);
    const entry = reply.payload.enter[0];
    expect(entry.format).toBe('alloy');
    expect(entry.generatorName).toBe('rc');
    expect(entry.data).toBe(FIXTURES.rc.xml);
  });

  it('drops sends issued before onopen has fired', async () => {
    const ws = new MockWebSocketLike();
    const onmessage = jest.fn<(ev: { data: string }) => void>();
    ws.onmessage = onmessage;
    ws.send(JSON.stringify({ type: 'meta' }));
    await flush();
    expect(onmessage).not.toHaveBeenCalled();
  });

  it('closes async and ignores subsequent sends', async () => {
    const ws = new MockWebSocketLike();
    const onclose = jest.fn();
    const onmessage = jest.fn<(ev: { data: string }) => void>();
    ws.onclose = onclose;
    ws.onmessage = onmessage;
    await flush();
    ws.close();
    await flush();
    expect(ws.readyState).toBe(WebSocket.CLOSED);
    expect(onclose).toHaveBeenCalledTimes(1);
    ws.send(JSON.stringify({ type: 'meta' }));
    await flush();
    expect(onmessage).not.toHaveBeenCalled();
  });

  it('silently ignores invalid JSON', async () => {
    const ws = new MockWebSocketLike();
    const onmessage = jest.fn<(ev: { data: string }) => void>();
    ws.onmessage = onmessage;
    await flush();
    expect(() => ws.send('not json')).not.toThrow();
    await flush();
    expect(onmessage).not.toHaveBeenCalled();
  });
});
