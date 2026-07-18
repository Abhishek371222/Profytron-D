#!/usr/bin/env node
/**
 * Screenshot capture — reuses journey walker with shots enabled.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const r = spawnSync(process.execPath, [path.join(__dirname, 'capture-journeys.mjs')], {
  stdio: 'inherit',
  cwd: ROOT,
  env: { ...process.env, PRODUCT_AUDIT_SHOTS: '1' },
});
process.exit(r.status || 0);
