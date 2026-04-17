import {
  AlloyInstance,
  applyProjections,
  getInstanceType,
  getTypeAtoms
} from '@/alloy-instance';
import { getProjectedTypes, SterlingThemeOld } from '@/sterling-theme';

export function projectInstance(
  instance: AlloyInstance,
  theme?: SterlingThemeOld
): AlloyInstance {
  const projectedAtoms = pickProjectedAtoms(instance, theme);
  return applyProjections(instance, projectedAtoms);
}

export function projectInstances(
  instances: AlloyInstance[],
  theme?: SterlingThemeOld
): AlloyInstance[] {
  return instances.map((instance) => projectInstance(instance, theme));
}

function pickProjectedAtoms(
  instance: AlloyInstance,
  theme?: SterlingThemeOld
): string[] {
  if (!theme) return [];
  return getProjectedTypes(theme).map((typeId) => {
    const projectedType = getInstanceType(instance, typeId);
    const projectedAtoms = getTypeAtoms(projectedType);
    return projectedAtoms[0].id;
  });
}
