#!/usr/bin/env node
/**
 * Chain product-audit captures → reports. Skips gracefully on soft failures.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const soft = new Set([
  'capture-journeys.mjs',
  'capture-screenshots.mjs',
  'capture-errors.mjs',
  'capture-empty-states.mjs',
]);

const steps = [
  'capture-journeys.mjs',
  // screenshots already taken in journeys when PRODUCT_AUDIT_SHOTS!=0
  'capture-errors.mjs',
  'capture-empty-states.mjs',
  'capture-conversion.mjs',
  'generate-reports.mjs',
];

for (const s of steps) {
  console.log(`\n=== ${s} ===`);
  const r = spawnSync(process.execPath, [path.join(__dirname, s)], {
    stdio: 'inherit',
    cwd: ROOT,
    env: process.env,
  });
  if (r.status !== 0 && !soft.has(s)) {
    console.error(`${s} failed with ${r.status}`);
    process.exit(r.status || 1);
  }
}
console.log('\nProduct audit Phase 1 complete.');
