import { AlloyInstance, getInstanceTypes } from '@/alloy-instance';
import { NodeStyleSpec, SterlingTheme } from '@/sterling-theme';
import { getTypeNodeStylesSpecs } from './getTypeNodeStylesSpecs';
import { getWildcardNodeStylesSpecs } from './getWildcardNodeStylesSpecs';

export function getInstanceNodeStyleSpecs(
  instance: AlloyInstance,
  theme: SterlingTheme
): Record<string, NodeStyleSpec[]> {
  const nodeSpecs: Record<string, NodeStyleSpec[]> = {
    '*': getWildcardNodeStylesSpecs([theme])
  };
  getInstanceTypes(instance).forEach((type) => {
    nodeSpecs[type.id] = getTypeNodeStylesSpecs(type.id, [theme]);
  });
  return nodeSpecs;
}
