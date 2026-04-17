import { AlloyInstance, getInstanceRelations } from '@/alloy-instance';
import { EdgeStyleSpec, SterlingTheme } from '@/sterling-theme';
import { getRelationEdgeStylesSpecs } from './getRelationEdgeStylesSpecs';
import { getWildcardEdgeStylesSpecs } from './getWildcardEdgeStylesSpecs';

export function getInstanceEdgeStyleSpecs(
  instance: AlloyInstance,
  theme: SterlingTheme
): Record<string, EdgeStyleSpec[]> {
  const edgeSpecs: Record<string, EdgeStyleSpec[]> = {
    '*': getWildcardEdgeStylesSpecs([theme])
  };
  getInstanceRelations(instance).forEach((relation) => {
    edgeSpecs[relation.id] = getRelationEdgeStylesSpecs(relation.id, [theme]);
  });
  return edgeSpecs;
}
