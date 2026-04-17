import { SterlingThemeOld } from '@/sterling-theme';

export function getHiddenTypes(theme: SterlingThemeOld): string[] {
  const hiddenTypes: string[] = [];
  theme.nodes?.forEach((nodeTheme) => {
    if (nodeTheme.visible === false) {
      nodeTheme.targets?.forEach((target) => {
        if (target !== '*') {
          hiddenTypes.push(target.type);
        }
      });
    }
  });
  return hiddenTypes;
}
