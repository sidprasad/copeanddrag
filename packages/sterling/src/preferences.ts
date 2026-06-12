export interface SterlingPreferences {
  layout: {
    // The bottom-docked drawer's initial / min / max height in px.
    drawerHeight: number;
    drawerMinHeight: number;
    drawerMaxHeight: number;
  };
}

export const defaultPreferences: SterlingPreferences = {
  layout: {
    drawerHeight: 280,
    drawerMinHeight: 120,
    drawerMaxHeight: 640
  }
};
