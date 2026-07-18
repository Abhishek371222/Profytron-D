/**
 * Thin gate: Phase 1B runtime artifacts exist (not pixel assertions).
 */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const phase1b = path.resolve(__dirname, '../../../../docs/ui-audit/phase1b');

test.describe('UI Excellence Phase 1B artifacts', () => {
  test('charter + taxonomy exist', () => {
    expect(fs.existsSync(path.join(phase1b, 'README.md'))).toBeTruthy();
    expect(fs.existsSync(path.join(phase1b, 'METRIC_TAXONOMY.md'))).toBeTruthy();
    expect(fs.existsSync(path.join(phase1b, 'EXIT_CRITERIA.md'))).toBeTruthy();
  });

  test('runtime harness modules exist', () => {
    const rt = path.resolve(__dirname, '../../../../tools/ui-audit/runtime');
    expect(fs.existsSync(path.join(rt, 'capture-runtime.mjs'))).toBeTruthy();
    expect(fs.existsSync(path.join(rt, 'capture-extended.mjs'))).toBeTruthy();
    expect(fs.existsSync(path.join(rt, 'generate-runtime-reports.mjs'))).toBeTruthy();
  });

  test('reports present when generated', () => {
    const report = path.join(phase1b, 'reports', 'RUNTIME_AUDIT_REPORT.md');
    test.skip(!fs.existsSync(report), 'reports not generated yet');
    expect(fs.existsSync(path.join(phase1b, 'reports', 'INTERACTION_LATENCY.md'))).toBeTruthy();
    expect(fs.existsSync(path.join(phase1b, 'reports', 'PHASE2_INPUTS.md'))).toBeTruthy();
  });
});
