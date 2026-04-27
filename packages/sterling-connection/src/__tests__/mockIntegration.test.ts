/** @jest-environment jsdom */
import { describe, expect, it } from '@jest/globals';
import { configureStore } from '@reduxjs/toolkit';
import dataReducer from '../../../sterling/src/state/data/dataSlice';
import evaluatorReducer from '../../../sterling/src/state/evaluator/evaluatorSlice';
import providerReducer from '../../../sterling/src/state/provider/providerSlice';
import {
  buttonClicked,
  connectSterling,
  evalRequested,
  metaRequested
} from '../actions';
import { sterlingConnectionMiddleware } from '../middleware';

// Drives the mock provider through the real middleware + slices to prove the
// "graph loads" path end-to-end. The mock fires its replies from setTimeout(0)
// callbacks, so each round-trip needs a couple of flushes to settle.
const flush = () => new Promise<void>((r) => setTimeout(r, 0));
const settle = async () => {
  await flush();
  await flush();
};

function makeStore() {
  return configureStore({
    reducer: {
      provider: providerReducer,
      data: dataReducer,
      evaluator: evaluatorReducer
    },
    middleware: (getDefault) =>
      getDefault({
        // The state stores non-serializable parsed instances (DOM-derived
        // AlloyDatum) and the mock middleware uses non-serializable actions
        // for the WebSocket reference; disable both checks for the test store.
        serializableCheck: false,
        immutableCheck: false
      }).concat(sterlingConnectionMiddleware())
  });
}

describe('mock provider end-to-end', () => {
  it('marks the store connected after dispatching connectSterling("mock")', async () => {
    const store = makeStore();
    store.dispatch(connectSterling('mock'));
    await settle();
    expect(store.getState().provider.connected).toBe(true);
  });

  it('populates provider metadata after metaRequested', async () => {
    const store = makeStore();
    store.dispatch(connectSterling('mock'));
    await settle();
    store.dispatch(metaRequested());
    await settle();
    const { provider } = store.getState();
    expect(provider.providerName).toBe('Mock');
    expect(provider.providerGenerators).toEqual(expect.arrayContaining(['rc']));
  });

  it('lands a fully-parsed 12-instance trace in the data slice when the rc generator is clicked', async () => {
    const store = makeStore();
    store.dispatch(connectSterling('mock'));
    await settle();
    store.dispatch(
      buttonClicked({
        id: undefined,
        onClick: 'run',
        context: { generatorName: 'rc' }
      })
    );
    await settle();
    const { data } = store.getState();
    expect(data.datumIds).toHaveLength(1);
    expect(data.active).not.toBeNull();
    const datum = data.datumById[data.active!];
    expect(datum.format).toBe('alloy');
    // Punchline: the rc XML flowed through the real Alloy parser and the
    // 12-frame trace is intact in state. Regressions in parseAlloyXML,
    // parseJoin, onMessage, or dataExtraReducers all surface here.
    expect(datum.parsed.instances).toHaveLength(12);
  });

  it('round-trips an eval expression through the evaluator slice', async () => {
    const store = makeStore();
    store.dispatch(connectSterling('mock'));
    await settle();
    store.dispatch(
      buttonClicked({
        id: undefined,
        onClick: 'run',
        context: { generatorName: 'rc' }
      })
    );
    await settle();
    const datumId = store.getState().data.active!;
    store.dispatch(
      evalRequested({ id: 'e1', datumId, expression: '1+1' })
    );
    await settle();
    const expr = store.getState().evaluator.expressionsById['e1'];
    expect(expr).toBeDefined();
    expect(expr.expression).toBe('1+1');
    expect(expr.result).toBe('(mock) 1+1');
  });
});
