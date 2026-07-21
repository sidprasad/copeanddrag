/** @jest-environment jsdom */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { buttonClicked, dataReceived } from '@/sterling-connection';
import {
  instanceHarvestMiddleware,
  NO_MORE_INSTANCES_SIG_LABEL
} from '../instanceHarvestMiddleware';
import {
  harvestInstanceLoaded,
  harvestOutOfInstances,
  harvestStarted
} from '../../state/instanceHarvest/instanceHarvestSlice';
import { newInstanceHarvestState } from '../../state/instanceHarvest/instanceHarvest';
import type { InstanceHarvestState } from '../../state/instanceHarvest/instanceHarvest';

// Minimal stand-in for the spytial-core browser bundle. getSpytialCore()
// requires parseLayoutSpec to be a function; the middleware itself uses
// AlloyInstance.parseAlloyXML and the AlloyDataInstance constructor.
class FakeDataInstance {
  constructor(private raw: any) {}
  getTypes() {
    return this.raw.types || [];
  }
}

function installFakeCore() {
  (window as any).spytialcore = {
    parseLayoutSpec: () => ({}),
    AlloyInstance: {
      parseAlloyXML: (xml: string) => {
        if (xml === 'sentinel-xml') {
          return {
            instances: [{ types: [{ id: NO_MORE_INSTANCES_SIG_LABEL }] }]
          };
        }
        if (xml === 'empty-xml') {
          return { instances: [] };
        }
        return { instances: [{ types: [{ id: 'Node' }], source: xml }] };
      }
    },
    AlloyDataInstance: FakeDataInstance
  };
}

function makeStore(harvest: Partial<InstanceHarvestState>) {
  const state = {
    instanceHarvest: { ...newInstanceHarvestState(), ...harvest }
  };
  return {
    getState: () => state,
    dispatch: jest.fn()
  };
}

/** Run one action through the middleware with a pass-through next(). */
function run(store: ReturnType<typeof makeStore>, action: any) {
  const next = jest.fn((a: any) => a);
  (instanceHarvestMiddleware as any)(store)(next)(action);
  return next;
}

function datumAction(data: string, generatorName = 'run') {
  return dataReceived({
    enter: [{ id: 'd1', data, format: 'alloy', generatorName }],
    update: [],
    exit: []
  } as any);
}

function dispatchedActions(store: ReturnType<typeof makeStore>) {
  return (store.dispatch as jest.Mock).mock.calls.map((c: any[]) => c[0]);
}

describe('instanceHarvestMiddleware', () => {
  beforeEach(() => {
    installFakeCore();
  });

  it('requests the first instance when a harvest starts', () => {
    const store = makeStore({});
    run(store, harvestStarted({ targetCount: 3, generatorName: 'run' }));

    const actions = dispatchedActions(store);
    expect(actions).toHaveLength(1);
    expect(buttonClicked.match(actions[0])).toBe(true);
    expect(actions[0].payload).toMatchObject({
      onClick: 'next',
      context: { generatorName: 'run' }
    });
  });

  it('accumulates a matching instance and pumps the next request', () => {
    const store = makeStore({
      status: 'harvesting',
      targetCount: 3,
      generatorName: 'run',
      instances: []
    });
    run(store, datumAction('instance-xml'));

    const actions = dispatchedActions(store);
    expect(actions).toHaveLength(2);
    expect(harvestInstanceLoaded.match(actions[0])).toBe(true);
    expect(actions[0].payload.instance).toBeInstanceOf(FakeDataInstance);
    expect(buttonClicked.match(actions[1])).toBe(true);
  });

  it('stops pumping once the target count is reached', () => {
    const store = makeStore({
      status: 'harvesting',
      targetCount: 2,
      generatorName: 'run',
      instances: [new FakeDataInstance({})]
    });
    run(store, datumAction('instance-xml'));

    const actions = dispatchedActions(store);
    expect(actions).toHaveLength(1);
    expect(harvestInstanceLoaded.match(actions[0])).toBe(true);
  });

  it('dispatches harvestOutOfInstances on the Forge sentinel and stops', () => {
    const store = makeStore({
      status: 'harvesting',
      targetCount: 5,
      generatorName: 'run',
      instances: []
    });
    run(store, datumAction('sentinel-xml'));

    const actions = dispatchedActions(store);
    expect(actions).toHaveLength(1);
    expect(harvestOutOfInstances.match(actions[0])).toBe(true);
  });

  it('ignores datums from a different generator', () => {
    const store = makeStore({
      status: 'harvesting',
      targetCount: 3,
      generatorName: 'run',
      instances: []
    });
    run(store, datumAction('instance-xml', 'check'));

    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('ignores datums when no harvest is active', () => {
    const store = makeStore({ status: 'idle' });
    run(store, datumAction('instance-xml'));

    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('ignores datums with no parseable instances', () => {
    const store = makeStore({
      status: 'harvesting',
      targetCount: 3,
      generatorName: 'run',
      instances: []
    });
    run(store, datumAction('empty-xml'));

    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('always passes the action through to next()', () => {
    const store = makeStore({ status: 'idle' });
    const action = datumAction('instance-xml');
    const next = run(store, action);
    expect(next).toHaveBeenCalledWith(action);
  });
});
