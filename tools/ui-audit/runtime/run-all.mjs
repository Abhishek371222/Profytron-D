#!/usr/bin/env node
/** Phase 1B lab runner — Tier A + extended (scaled sessions) + reports. */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = {
  ...process.env,
  UI_AUDIT_SESSION_SCALE: process.env.UI_AUDIT_SESSION_SCALE || '0.01',
  UI_AUDIT_EXTENDED: 'all',
};

function run(script) {
  const r = spawnSync(process.execPath, [path.join(__dirname, script)], {
    stdio: 'inherit',
    env,
    cwd: path.resolve(__dirname, '../../..'),
  });
  if (r.status) process.exit(r.status || 1);
}

run('capture-runtime.mjs');
run('capture-extended.mjs');
run('generate-runtime-reports.mjs');
