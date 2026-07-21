/** @jest-environment jsdom */

import { beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { getLayoutSpecWarnings } from '../spytialCore';
import type { SpytialCoreApi } from '../spytialCore';

const require = createRequire(import.meta.url);

// Load the real installed spytial-core browser bundle into a VM context, the
// same way the app does at runtime (via a <script> that sets `spytialcore`).
// This exercises the actual 3.3.0 parseLayoutSpec warning contract rather than a
// stub, so the test fails if a future bump changes the warning shape.
function installedSpytialCore(): SpytialCoreApi {
  const bundlePath = require.resolve('spytial-core');
  const bundle = readFileSync(bundlePath, 'utf8');
  return runInNewContext(`${bundle}\nspytialcore;`, {
    window,
    document,
    navigator,
    HTMLElement,
    customElements,
    DOMParser,
    Node,
    MutationObserver,
    console,
    crypto: globalThis.crypto,
    setTimeout,
    clearTimeout
  }) as SpytialCoreApi;
}

describe('getLayoutSpecWarnings (installed spytial-core)', () => {
  let core: SpytialCoreApi;

  beforeAll(() => {
    core = installedSpytialCore();
  });

  beforeEach(() => {
    // getSpytialCore() reads these globals; reset them before each test.
    window.spytialcore = core;
    window.CndCore = undefined;
    window.CnDCore = undefined;
  });

  it('returns no warnings for a clean spec', () => {
    const warnings = getLayoutSpecWarnings(
      'constraints:\n  - orientation:\n      selector: link\n      directions: [left]\n'
    );
    expect(warnings).toEqual([]);
  });

  it('surfaces a deprecation as a { code, message } warning without throwing', () => {
    const warnings = getLayoutSpecWarnings(
      'directives: [{atomColor: {selector: Node, value: red}}]'
    );
    expect(warnings.length).toBeGreaterThanOrEqual(1);
    expect(warnings[0]).toEqual(
      expect.objectContaining({
        code: expect.any(String),
        message: expect.any(String)
      })
    );
    expect(warnings.some((w) => w.code === 'deprecated')).toBe(true);
  });

  it('swallows a parse error and returns [] (an error is not a warning)', () => {
    // Unterminated flow collection makes parseLayoutSpec throw a YAML exception;
    // real errors travel via the error modal, so the warning channel stays empty.
    const warnings = getLayoutSpecWarnings(
      'constraints:\n  - orientation:\n    selector: [unclosed\n'
    );
    expect(warnings).toEqual([]);
  });

  it('returns [] when spytial-core is unavailable', () => {
    window.spytialcore = undefined;
    expect(getLayoutSpecWarnings('directives: []')).toEqual([]);
  });
});
