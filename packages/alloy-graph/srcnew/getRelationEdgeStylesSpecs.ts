import { EdgeStyleSpec, SterlingTheme } from '@/sterling-theme';
import { flatten } from 'lodash-es';

/**
 * Get an ordered array of edge style specs for the given relation. Only
 * explicitly defined targets (meaning no wildcards) that are equal to the
 * given relation are included.
 *
 * @param relation The relation to match.
 * @param themes The themes to retrieve specs from.
 */
export function getRelationEdgeStylesSpecs(
  relation: string,
  themes: SterlingTheme[]
): EdgeStyleSpec[] {
  return flatten(
    themes.map((theme) =>
      theme.edges
        ? theme.edges.filter(
            (spec) =>
              spec.targets &&
              spec.targets.some(
                (target) => target !== '*' && target.relation === relation
              )
          )
        : []
    )
  );
}
