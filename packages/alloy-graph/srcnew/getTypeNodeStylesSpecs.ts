import { NodeStyleSpec, SterlingTheme } from '@/sterling-theme';
import { flatten } from 'lodash-es';

/**
 * Get an ordered array of node style specs for the given type. Only explicitly
 * defined targets (meaning no wildcards) that are equal to the given type are
 * included.
 *
 * @param type The type to match.
 * @param themes The themes to retrieve specs from.
 */
export function getTypeNodeStylesSpecs(
  type: string,
  themes: SterlingTheme[]
): NodeStyleSpec[] {
  return flatten(
    themes.map((theme) =>
      theme.nodes
        ? theme.nodes.filter(
            (spec) =>
              spec.targets &&
              spec.targets.some(
                (target) => target !== '*' && target.type === type
              )
          )
        : []
    )
  );
}
