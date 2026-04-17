import { GraphLayoutSettings } from '@/alloy-graph';
import { defaultThemeNew, SterlingTheme } from '@/sterling-theme';

export const DEFAULT_LAYOUT_SETTINGS: GraphLayoutSettings = {
  nodeWidth: 100,
  nodeHeight: 60,
  nodeSep: 100,
  rankSep: 100
};

export const DEFAULT_THEME: SterlingTheme = defaultThemeNew();
