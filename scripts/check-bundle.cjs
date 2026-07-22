#!/usr/bin/env node
/**
 * Post-build guard for the bundle-size optimizations in webpack.config.cjs.
 *
 * Locks in two intentional trims so a future config change can't silently
 * re-bloat the packaged output:
 *   1. MonacoWebpackPlugin is restricted to js/ts, so only the ts + editor
 *      language workers are emitted (the app's ScriptView editor uses
 *      language='javascript', which is served by ts.worker.js). The
 *      css/html/json workers must NOT be emitted (~1.7 MB).
 *   2. FaviconsWebpackPlugin has appleStartup disabled, so the ~34 iOS PWA
 *      splash screens (apple-touch-startup-image-*, ~4.9 MB) must NOT be
 *      emitted.
 *
 * Usage: node scripts/check-bundle.cjs [distDir]   (default: dist)
 * Exits non-zero with a clear message if any expectation is violated.
 */
const fs = require('fs');
const path = require('path');

const distDir = path.resolve(process.cwd(), process.argv[2] || 'dist');

// Workers the app genuinely uses — must be present.
const REQUIRED_WORKERS = ['ts.worker.js', 'editor.worker.js'];
// Workers for languages the app never opens — must be gone.
const FORBIDDEN_WORKERS = ['css.worker.js', 'html.worker.js', 'json.worker.js'];

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const errors = [];

if (!fs.existsSync(distDir) || !fs.statSync(distDir).isDirectory()) {
  console.error(`[check-bundle] dist directory not found: ${distDir}`);
  console.error('[check-bundle] Run a build first (e.g. `yarn build:alloy`).');
  process.exit(2);
}

const allFiles = walk(distDir);
const basenames = new Set(allFiles.map((f) => path.basename(f)));

for (const w of REQUIRED_WORKERS) {
  if (!basenames.has(w)) {
    errors.push(`Missing required Monaco worker: ${w} (the JS editor needs it).`);
  }
}

for (const w of FORBIDDEN_WORKERS) {
  if (basenames.has(w)) {
    errors.push(
      `Unexpected Monaco worker emitted: ${w}. ` +
        `MonacoWebpackPlugin should be restricted to languages: ['javascript', 'typescript'].`
    );
  }
}

const startupImages = allFiles.filter((f) =>
  /apple-touch-startup-image/i.test(path.basename(f))
);
if (startupImages.length > 0) {
  errors.push(
    `${startupImages.length} apple-touch-startup-image file(s) emitted (expected 0). ` +
      `Set favicons.icons.appleStartup: false in FaviconsWebpackPlugin.`
  );
}

if (errors.length > 0) {
  console.error(`[check-bundle] FAILED for ${path.relative(process.cwd(), distDir) || '.'}:`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(
  `[check-bundle] OK — ${path.relative(process.cwd(), distDir) || '.'}: ` +
    `required workers present (${REQUIRED_WORKERS.join(', ')}), ` +
    `no css/html/json workers, no apple-touch-startup-image files.`
);
