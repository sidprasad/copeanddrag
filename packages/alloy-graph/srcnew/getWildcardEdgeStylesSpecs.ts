import { EdgeStyleSpec, SterlingTheme } from '@/sterling-theme';
import { flatten } from 'lodash-es';

/**
 * Get all wildcard edge style specs from a set of themes.
 *
 * @param themes The themes to extract wildcard specs from.
 */
export function getWildcardEdgeStylesSpecs(
  themes: SterlingTheme[]
): EdgeStyleSpec[] {
  return flatten(
    themes.map((theme) =>
      theme.edges
        ? theme.edges.filter(
            (spec) =>
              spec.targets && spec.targets.some((target) => target === '*')
          )
        : []
    )
  );
}
