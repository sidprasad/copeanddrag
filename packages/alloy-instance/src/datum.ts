import { AlloyInstance } from '@/alloy-instance';
import { GraphProps } from '@/graph-svg';
import { SterlingTheme } from '@/sterling-theme';

export interface VisualizerConfig {
  script?: string,
  theme?: string,
  cnd?: string
}

export interface AlloyDatum {
  instances: AlloyInstance[];
  bitwidth?: number;
  command?: string;
  loopBack?: number;
  maxSeq?: number;
  maxTrace?: number;
  minTrace?: number;
  traceLength?: number;
  visualizerConfig?: VisualizerConfig;
}

export interface AlloyDatumTrace extends AlloyDatum {
  loopBack: number;
  maxTrace: number;
  minTrace: number;
  traceLength: number;
}

export const isAlloyDatum = (datum: any): datum is AlloyDatum => {
  return Array.isArray(datum.instances);
};

export const isAlloyDatumTrace = (
  datum: AlloyDatum
): datum is AlloyDatumTrace => {
  return (
    // datum.minTrace !== undefined &&
    // datum.minTrace > 0 &&
    // datum.maxTrace !== undefined &&
    // datum.maxTrace > 0 &&
    // datum.traceLength !== undefined &&
    datum.loopBack !== undefined
  );
};

export function generateGraphId(
  datum: AlloyDatum,
  theme: SterlingTheme,
  projections: Record<string, string>,
  index: number
): string {
  return '';
}

export const getTraceLength = (datum: AlloyDatumTrace): number => {
  return datum.traceLength;
};

export const getTraceLoopback = (datum: AlloyDatumTrace): number => {
  return datum.loopBack;
};

/**
 * The signature label that Forge uses to indicate no more instances are available.
 * When all instances have been exhausted, Forge sends a special instance with this
 * signature containing an atom labeled "No more instances".
 */
export const NO_MORE_INSTANCES_SIG_LABEL = 
  'No more instances! Some equivalent instances may have been removed through symmetry breaking.';

/**
 * Check if an AlloyDatum represents the "no more instances" state.
 * Forge signals this by sending an instance with a special signature whose label
 * contains "No more instances".
 * 
 * @param datum The AlloyDatum to check
 * @returns true if this datum indicates no more instances are available
 */
export const isOutOfInstances = (datum: AlloyDatum): boolean => {
  if (!datum.instances || datum.instances.length === 0) return false;
  
  // Check the first instance for the "no more instances" signature
  const instance = datum.instances[0];
  const types = Object.values(instance.types);
  
  return types.some(type => type.id === NO_MORE_INSTANCES_SIG_LABEL);
};
