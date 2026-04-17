import { SterlingThemeOld } from '@/sterling-theme';

export function getProjectedTypes(theme: SterlingThemeOld): string[] {
  return theme.projections?.map((projection) => projection.type) || [];
}
