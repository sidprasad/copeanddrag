import { ProviderState } from './provider';

/**
 * Select the connection status.
 */
function selectIsConnected(state: ProviderState): boolean {
  return state.connected;
}

/**
 * Select the name of the provider.
 */
function selectProviderName(state: ProviderState): string {
  return state.providerName;
}

/**
 * Select the generator names this provider uses.
 */
function selectProviderGeneratorNames(state: ProviderState): string[] | undefined {
  return state.providerGenerators
}

/**
 * Select the list of provider-exposed features.
 */
function selectProviderFeatures(state: ProviderState): string[] {
  return state.features || [];
}

/**
 * Determine whether a named feature flag is enabled by the provider.
 */
function selectHasFeature(state: ProviderState, feature: string): boolean {
  return (state.features || []).includes(feature);
}

export default {
  selectIsConnected,
  selectProviderName,
  selectProviderGeneratorNames,
  selectProviderFeatures,
  selectHasFeature
};
