import { NodeStyleSpec, SterlingTheme } from '@/sterling-theme';
import { flatten } from 'lodash-es';

/**
 * Get all wildcard node style specs from a set of themes.
 *
 * @param themes The themes to extract wildcard specs from.
 */
export function getWildcardNodeStylesSpecs(
  themes: SterlingTheme[]
): NodeStyleSpec[] {
  return flatten(
    themes.map((theme) =>
      theme.nodes
        ? theme.nodes.filter(
            (spec) =>
              spec.targets && spec.targets.some((target) => target === '*')
          )
        : []
    )
  );
}
