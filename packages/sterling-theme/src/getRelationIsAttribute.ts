import { SterlingTheme } from '@/sterling-theme';
import { WritableDraft } from 'immer/dist/types/types-external';

export function getRelationIsAttribute(
  theme: SterlingTheme | WritableDraft<SterlingTheme>,
  relation: string
): boolean {
  const edges = theme.edges;
  return edges
    ? edges.some(
        (spec) =>
          spec.asAttribute === true &&
          spec.targets?.some(
            (target) => target === '*' || target.relation === relation
          )
      )
    : false;
}

/**
 * If this relation is themed with a source and target index, return them.
 */
export function getRelationSTIndexes(
  theme: SterlingTheme | WritableDraft<SterlingTheme> | undefined,
  relation: string, 
  arity: number
): [number,number] {
  if(arity < 2) return [0, 0]
  if(!theme) return [0,arity-1]
  const edges = theme.edges;
  if(!edges) return [0,arity-1];
  
  const firstMatch = edges.find(
      (spec) =>
        // Any index override to account for
        (spec.sourceIndex || spec.targetIndex) &&
        spec.targets?.some(
          (target) => target === '*' || target.relation === relation
        )
    )
  if(!firstMatch) return [0, arity-1];
  const sourceIndex = firstMatch.sourceIndex ? firstMatch.sourceIndex : 0
  const targetIndex = firstMatch.targetIndex ? firstMatch.targetIndex : arity-1
  return [sourceIndex, targetIndex]
}