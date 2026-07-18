#!/usr/bin/env node
/**
 * Phase 2 visual regression helper — compares Phase 1 vs Phase 2 screenshot inventories.
 * Intentionally lists expected diffs from debt IDs; flags unexpected filename-level gaps.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const PHASE1 = path.join(ROOT, 'docs/ui-audit/phase1/screenshots');
const PHASE2 = path.join(ROOT, 'docs/ui-audit/phase2/screenshots');
const OUT = path.join(ROOT, 'docs/ui-audit/phase2/reports/VISUAL_REGRESSION_REPORT.md');

const intentional = [
  { pattern: /billing__|subscriptions__|connected-accounts__/, debt: 'table-overflow-x__*', note: 'Column priority + sticky header' },
  { pattern: /dashboard__|settings-profile__|marketplace__|wallet__|login__/, debt: 'small-touch-targets / density', note: 'Touch-min chrome + data-density spacing' },
];

function listPng(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.png'));
}

const p1 = new Set(listPng(PHASE1));
const p2 = listPng(PHASE2);
const p2set = new Set(p2);

const onlyPhase2 = p2.filter((f) => !p1.has(f));
const missingPhase2 = [...p1].filter((f) => !p2set.has(f)).slice(0, 40);

const matched = p2.filter((f) => p1.has(f));
const intentionalHits = matched.filter((f) => intentional.some((i) => i.pattern.test(f)));

const md = [
  '# Visual Regression Report',
  '',
  '**Program:** UI Excellence Phase 2',
  '**Date:** ' + new Date().toISOString(),
  '',
  '## Inventories',
  '',
  '| Set | Count |',
  '| --- | --- |',
  '| Phase 1 screenshots | ' + p1.size + ' |',
  '| Phase 2 screenshots (this run) | ' + p2.length + ' |',
  '| Overlap filenames | ' + matched.length + ' |',
  '',
  '## Intentional differences (debt-cited)',
  '',
  '| Debt / theme | Notes |',
  '| --- | --- |',
  ...intentional.map((i) => '| `' + i.debt + '` | ' + i.note + ' |'),
  '',
  'Matched Phase 2 captures on intentional routes: **' + intentionalHits.length + '**',
  '',
  '## Unexpected / gaps',
  '',
  '- New Phase 2-only filenames: ' + onlyPhase2.length,
  '- Phase 1 filenames not re-captured in Phase 2 slice: ' + missingPhase2.length + ' (expected when Phase 2 runs targeted matrices)',
  '',
  'Full matrices remain authoritative in `docs/ui-audit/phase1/`. Phase 2 slice validates fixed surfaces.',
  '',
  '## Verdict',
  '',
  p2.length === 0
    ? '_No Phase 2 screenshots yet — run targeted `UI_AUDIT_OUT=docs/ui-audit/phase2 UI_AUDIT_PATHS=... pnpm ui-audit:capture`._'
    : 'Targeted Phase 2 captures recorded. Investigate any visual delta outside intentional table/density/touch themes before Phase 3.',
  '',
].join('\n');

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, md);
console.log('Wrote', OUT);
