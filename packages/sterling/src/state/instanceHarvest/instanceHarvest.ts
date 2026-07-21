/**
 * State for Forge/Alloy instance harvesting: programmatically collecting N
 * instances from the provider's instance stream (the same "next" stream the
 * user advances by hand).
 *
 * This is deliberately UI-agnostic. It exists so that features which need
 * multi-instance evidence — e.g. Magic Layout selector synthesis (#143) or an
 * interactive suggestion-repair flow in the layout editor — can request
 * instances without owning any provider-protocol details.
 *
 * Note: harvesting advances the provider's instance stream, exactly as if the
 * user clicked "Next" N times. Callers should communicate that to the user.
 */

export type HarvestStatus =
  | 'idle'
  | 'harvesting'
  | 'done'
  | 'outOfInstances'
  | 'error';

export interface InstanceHarvestState {
  status: HarvestStatus;
  /** How many instances the caller asked for. */
  targetCount: number;
  /** Generator whose instance stream is being harvested. */
  generatorName: string | undefined;
  /**
   * AlloyDataInstance objects collected so far. Non-serializable; this path is
   * excluded from the store's serializability check.
   */
  instances: any[];
  error: string | null;
}

export function newInstanceHarvestState(): InstanceHarvestState {
  return {
    status: 'idle',
    targetCount: 0,
    generatorName: undefined,
    instances: [],
    error: null
  };
}
