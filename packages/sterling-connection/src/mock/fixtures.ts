import rcXml from '../../../../demos/rc/rc-datum.xml';

/**
 * Registry of Alloy/Forge XML instance fixtures available to the mock provider.
 *
 * To add a fixture:
 *   1. Drop the `<instance>…</instance>` XML file somewhere under demos/ (or anywhere
 *      the TS files can reach).
 *   2. `import myXml from '<path>'` above.
 *   3. Add an entry: `mykey: { label: 'My fixture', xml: myXml }`.
 *
 * Select at runtime with `?fixture=<key>` — e.g. http://localhost:8081/?fixture=rc.
 * If no fixture key is provided, or the key is unknown, `DEFAULT_FIXTURE` is served.
 */
export interface Fixture {
  /** Human-readable name. */
  label: string;
  /** Raw Alloy/Forge XML (may contain multiple `<instance>` elements for a trace). */
  xml: string;
  /** Optional override for the datum's generatorName (defaults to the registry key). */
  generatorName?: string;
}

export const FIXTURES: Record<string, Fixture> = {
  rc: {
    label: 'Goats and wolves river crossing (trace)',
    xml: rcXml
  }
};

export const DEFAULT_FIXTURE = 'rc';

/**
 * Resolve which fixture to serve based on the current page URL's
 * `?fixture=<key>` query param. Unknown keys log and fall back to the default.
 */
export function getActiveFixture(): Fixture {
  let key = DEFAULT_FIXTURE;
  if (typeof window !== 'undefined' && window.location?.search) {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get('fixture');
    if (requested) {
      if (requested in FIXTURES) {
        key = requested;
      } else {
        console.warn(
          `[mock] Unknown fixture "${requested}". Known fixtures: ${Object.keys(FIXTURES).join(', ')}. Falling back to "${DEFAULT_FIXTURE}".`
        );
      }
    }
  }
  return FIXTURES[key];
}
