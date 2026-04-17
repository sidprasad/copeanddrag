export interface SterlingPreferences {
  layout: {
    drawerWidth: number;
    drawerMinWidth: number;
    drawerMaxWidth: number;
    explorerWidth: number;
    explorerMinWidth: number;
    explorerMaxWidth: number;
  };
}

export const defaultPreferences: SterlingPreferences = {
  layout: {
    drawerWidth: 350,
    drawerMinWidth: 100,
    drawerMaxWidth: 600,
    explorerWidth: 250,
    explorerMinWidth: 60,
    explorerMaxWidth: 250
  }
};
