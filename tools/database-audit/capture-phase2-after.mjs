#!/usr/bin/env node
/**
 * Run live + topology audits and copy key artifacts into phase2/data as after-*.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const P1 = path.join(ROOT, 'docs/database-audit/phase1/data');
const P2 = path.join(ROOT, 'docs/database-audit/phase2/data');
fs.mkdirSync(P2, { recursive: true });

function run(script) {
  console.log(`\n=== ${script} ===`);
  const r = spawnSync(process.execPath, [path.join(__dirname, script)], {
    stdio: 'inherit',
    cwd: ROOT,
    env: process.env,
  });
  if (r.status !== 0 && script !== 'restore-drill.mjs') {
    console.warn(`${script} exited ${r.status}`);
  }
}

run('live-audit.mjs');
run('topology-audit.mjs');
run('snapshot-lifecycle.mjs'); // dry-run default

const map = [
  ['query-timings.json', 'after-query-timings.json'],
  ['explain-analyze.json', 'after-explain-analyze.json'],
  ['sizes.json', 'after-sizes.json'],
  ['live-audit.json', 'after-live-audit.json'],
];
for (const [src, dest] of map) {
  const from = path.join(P1, src);
  if (fs.existsSync(from)) fs.copyFileSync(from, path.join(P2, dest));
}

// Window-2 unused index stats from after live audit
const live = JSON.parse(fs.readFileSync(path.join(P2, 'after-live-audit.json'), 'utf8'));
fs.writeFileSync(
  path.join(P2, 'index-stats-window2.json'),
  JSON.stringify(
    {
      at: new Date().toISOString(),
      unusedIndexCount: live.unusedIndexCount ?? (live.unusedIndexes || []).length,
      unusedSample: (live.unusedIndexes || []).slice(0, 50),
      fkIndexGaps: live.fkIndexGaps || [],
      duplicateIndexes: live.duplicateIndexes || [],
      note: 'Observation window 2 — do NOT drop zero-scan indexes based on this alone',
    },
    null,
    2,
  ),
);

console.log('\nPhase 2 after-capture written to', path.relative(ROOT, P2));
