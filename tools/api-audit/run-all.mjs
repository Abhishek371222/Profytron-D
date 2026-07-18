#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const steps = [
  'inventory.mjs',
  'capture-dependencies.mjs',
  'capture-validation.mjs',
  'capture-ws.mjs',
  'capture-latency.mjs',
  'capture-payloads.mjs',
  'capture-openapi.mjs',
  'capture-errors.mjs',
  'generate-reports.mjs',
];

for (const s of steps) {
  console.log(`\n=== ${s} ===`);
  const r = spawnSync(process.execPath, [path.join(__dirname, s)], {
    stdio: 'inherit',
    cwd: ROOT,
    env: process.env,
  });
  if (r.status !== 0 && !['capture-latency.mjs', 'capture-payloads.mjs', 'capture-openapi.mjs', 'capture-errors.mjs', 'capture-ws.mjs'].includes(s)) {
    process.exit(r.status || 1);
  }
}
console.log('\nAPI audit Phase 1 complete.');
