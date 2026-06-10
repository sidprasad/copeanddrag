import type store from '../state/store';
import { selectColorMode } from '../state/selectors';
import { applyColorModeToDom, persistColorMode } from './colorMode';

/**
 * Keep <html> in sync with the store's color mode: apply the initial mode, then
 * on every change reflect it to the DOM (driving the CSS-variable layer) and
 * persist it. Returns the store unsubscribe function.
 */
export function wireColorMode(appStore: typeof store): () => void {
  let prev = selectColorMode(appStore.getState());
  applyColorModeToDom(prev);

  return appStore.subscribe(() => {
    const next = selectColorMode(appStore.getState());
    if (next !== prev) {
      prev = next;
      applyColorModeToDom(next);
      persistColorMode(next);
    }
  });
}
