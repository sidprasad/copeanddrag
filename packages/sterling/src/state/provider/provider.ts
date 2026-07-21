export interface ProviderState {
  connected: boolean;
  providerName: string;
  providerGenerators: string[] | undefined;
  features: string[];
}

/**
 * Create a new provider state.
 */
export const newProviderState = (): ProviderState => {
  return {
    connected: false,
    providerName: 'unknown provider',
    providerGenerators: undefined,
    features: []
  };
};
