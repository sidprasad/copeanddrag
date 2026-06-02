import { AlloyDatum } from 'spytial-core/alloy-instance';
import { SterlingTheme } from '@/sterling-theme';

// Cope and Drag / Forge-specific helpers that are NOT part of the canonical Alloy instance/XML
// model (that now lives in spytial-core and is re-exported from ./index). Kept local here.

export function generateGraphId(
  datum: AlloyDatum,
  theme: SterlingTheme,
  projections: Record<string, string>,
  index: number
): string {
  return '';
}

export const NO_MORE_INSTANCES_SIG_LABEL =
  'No more instances! Some equivalent instances may have been removed through symmetry breaking.';

/**
 * Check if an AlloyDatum represents the "no more instances" state. Forge signals this by sending
 * an instance with a special signature whose label is NO_MORE_INSTANCES_SIG_LABEL.
 */
export const isOutOfInstances = (datum: AlloyDatum): boolean => {
  if (!datum.instances || datum.instances.length === 0) return false;
  const instance = datum.instances[0];
  const types = Object.values(instance.types);
  return types.some((type) => type.id === NO_MORE_INSTANCES_SIG_LABEL);
};
