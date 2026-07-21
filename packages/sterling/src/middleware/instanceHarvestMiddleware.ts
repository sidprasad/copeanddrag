import { buttonClicked, dataReceived } from '@/sterling-connection';
import { Middleware } from '@reduxjs/toolkit';
import { SterlingState } from '../state/store';
import {
  harvestInstanceLoaded,
  harvestOutOfInstances,
  harvestStarted
} from '../state/instanceHarvest/instanceHarvestSlice';
import { getSpytialCore } from '../utils/spytialCore';

/**
 * The signature label that Forge uses to indicate no more instances are available.
 */
export const NO_MORE_INSTANCES_SIG_LABEL =
  'No more instances! Some equivalent instances may have been removed through symmetry breaking.';

/**
 * Check if an AlloyDataInstance represents the "no more instances" state.
 */
export function isOutOfInstances(alloyDataInstance: any): boolean {
  try {
    const types = alloyDataInstance.getTypes?.() || [];
    return types.some((type: any) => {
      const typeId = type.id || type.getId?.() || '';
      return typeId === NO_MORE_INSTANCES_SIG_LABEL;
    });
  } catch {
    return false;
  }
}

/**
 * Ask the provider for the next instance in a generator's stream — the same
 * request the graph header's "Next" button sends.
 */
function requestNextInstance(
  dispatch: (action: any) => void,
  generatorName: string | undefined
) {
  dispatch(
    buttonClicked({
      id: undefined,
      onClick: 'next',
      context: generatorName ? { generatorName } : undefined
    })
  );
}

/**
 * Middleware that drives Forge/Alloy instance harvesting.
 *
 * Owns both halves of the protocol:
 *  - request pump: on harvestStarted, and after each accepted instance, sends
 *    a "next" click until targetCount instances are collected;
 *  - receive: on dataReceived, parses the newest datum, drops datums from
 *    other generators, detects Forge's "no more instances" sentinel, and
 *    accumulates AlloyDataInstance objects in the instanceHarvest slice.
 *
 * Callers (e.g. Magic Layout selector synthesis, #143) just dispatch
 * harvestStarted({ targetCount, generatorName }) and watch the slice.
 */
export const instanceHarvestMiddleware: Middleware<{}, SterlingState> =
  (store) => (next) => (action) => {
    // Let the action pass through first so state reflects it below.
    const result = next(action);

    if (harvestStarted.match(action)) {
      requestNextInstance(store.dispatch, action.payload.generatorName);
      return result;
    }

    if (dataReceived.match(action)) {
      try {
        const state = store.getState();
        const harvest = state.instanceHarvest;
        if (harvest.status !== 'harvesting') return result;

        const payload = action.payload;
        const core = getSpytialCore();
        if (!core || !payload.enter || payload.enter.length === 0) {
          return result;
        }

        const newDatum = payload.enter[payload.enter.length - 1];

        // Only accept datums from the generator being harvested.
        if (
          harvest.generatorName &&
          newDatum.generatorName !== harvest.generatorName
        ) {
          return result;
        }

        const parsedDatum = core.AlloyInstance.parseAlloyXML(newDatum.data);
        if (!parsedDatum.instances || parsedDatum.instances.length === 0) {
          return result;
        }

        const newInstance = new core.AlloyDataInstance(parsedDatum.instances[0]);

        if (isOutOfInstances(newInstance)) {
          store.dispatch(harvestOutOfInstances());
          return result;
        }

        store.dispatch(harvestInstanceLoaded({ instance: newInstance }));

        // Pump: keep requesting until the target count is reached.
        const collected = harvest.instances.length + 1;
        if (collected < harvest.targetCount) {
          requestNextInstance(store.dispatch, harvest.generatorName);
        }
      } catch (err) {
        console.error('[InstanceHarvest] Failed to load new instance:', err);
      }
    }

    return result;
  };
