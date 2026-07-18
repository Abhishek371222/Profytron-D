#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scripts = ['parse-prisma.mjs', 'live-audit.mjs', 'generate-reports.mjs'];

for (const s of scripts) {
  console.log(`\n=== ${s} ===`);
  const r = spawnSync(process.execPath, [path.join(__dirname, s)], {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
    env: process.env,
  });
  if (r.status !== 0 && s !== 'live-audit.mjs') {
    process.exit(r.status || 1);
  }
}
console.log('\nDatabase audit Phase 1 complete.');
