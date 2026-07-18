/**
 * Thin gate: Phase 1 UI audit artifacts exist (not visual pixel assertions).
 */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const phase1 = path.resolve(__dirname, '../../../../docs/ui-audit/phase1');

test.describe('UI Excellence Phase 1 artifacts', () => {
  test('phase1 directory scaffold exists', () => {
    expect(fs.existsSync(path.join(phase1, 'README.md'))).toBeTruthy();
    expect(fs.existsSync(path.join(phase1, 'diagrams', 'display-matrix.md'))).toBeTruthy();
    expect(fs.existsSync(path.join(phase1, 'before', 'OS_MANUAL_CHECKLIST.md'))).toBeTruthy();
  });

  test('route manifest exists', () => {
    const manifest = path.resolve(__dirname, '../../../../tools/ui-audit/routes.json');
    expect(fs.existsSync(manifest)).toBeTruthy();
    const data = JSON.parse(fs.readFileSync(manifest, 'utf8'));
    expect(data.routes.length).toBeGreaterThan(50);
    expect(data.viewports.mobile.length).toBe(7);
  });

  test('capture index present when matrix has been run', () => {
    const idx = path.join(phase1, 'viewport-matrix', 'index.json');
    test.skip(!fs.existsSync(idx), 'viewport-matrix/index.json not generated yet');
    const data = JSON.parse(fs.readFileSync(idx, 'utf8'));
    expect(data.count).toBeGreaterThan(0);
  });
});
