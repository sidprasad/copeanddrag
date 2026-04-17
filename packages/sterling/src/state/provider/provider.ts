export interface ProviderState {
  connected: boolean;
  providerName: string;
  providerGenerators: string[] | undefined;
  features: string[];
  /** Synthesis feature enabled via command-line flag (not provider) */
  synthesisEnabled: boolean;
}

/**
 * Create a new provider state.
 */
export const newProviderState = (): ProviderState => {
  return {
    connected: false,
    providerName: 'unknown provider',
    providerGenerators: undefined,
    features: [],
    synthesisEnabled: false
  };
};
