/**
 * App color mode: a light/dark switch for the Cope-and-Drag chrome.
 *
 * The active mode is reflected onto <html> as `data-theme`, which drives the
 * CSS-variable layer in `sterling-ui/src/themeVars.css`. The graph component
 * keeps its own theme; the two are synced (app is the source of truth) — see
 * GraphView/SpyTialGraph. Maps directly to the graph's `light`/`dark` theme
 * names, so `setTheme(colorMode)` just works.
 */

export type ColorMode = 'light' | 'dark';

const STORAGE_KEY = 'ccd-color-mode';

export function isColorMode(value: unknown): value is ColorMode {
  return value === 'light' || value === 'dark';
}

/** Resolve the initial mode: a persisted manual choice, else light. */
export function resolveInitialColorMode(): ColorMode {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isColorMode(stored)) return stored;
  } catch {
    /* no storage (private mode / non-DOM env) */
  }
  return 'light';
}

/** Reflect the mode onto <html> so the CSS-variable layer follows. */
export function applyColorModeToDom(mode: ColorMode): void {
  try {
    const el = document.documentElement;
    el.setAttribute('data-theme', mode);
    el.style.colorScheme = mode; // native form controls / scrollbars
  } catch {
    /* non-DOM environment (tests) */
  }
}

/** Persist a manual choice so it is remembered next load. */
export function persistColorMode(mode: ColorMode): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}
