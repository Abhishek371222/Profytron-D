/**
 * Thin gate: Product Audit Phase 1 artifacts exist.
 */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const phase1 = path.resolve(__dirname, '../../../../docs/product-audit/phase1');
const journeysManifest = path.resolve(
  __dirname,
  '../../../../tools/product-audit/journeys.json',
);

const REQUIRED_REPORTS = [
  'USER_JOURNEY_REPORT.md',
  'ONBOARDING_REPORT.md',
  'AUTH_REPORT.md',
  'BROKER_FLOW_REPORT.md',
  'STRATEGY_REPORT.md',
  'AI_COACH_REPORT.md',
  'MARKETPLACE_REPORT.md',
  'BILLING_REPORT.md',
  'SETTINGS_REPORT.md',
  'ERROR_RECOVERY_REPORT.md',
  'EMPTY_STATE_REPORT.md',
  'CONVERSION_REPORT.md',
  'FEATURE_COMPLETENESS.md',
  'PRODUCT_DEBT.md',
  'PRIORITY_MATRIX.md',
  'PHASE2_INPUTS.md',
];

const REQUIRED_DATA = [
  'journey-results.json',
  'conversion.json',
  'errors.json',
  'empty-states.json',
  'inventory.json',
];

test.describe('Product Audit Phase 1 artifacts', () => {
  test('journeys.json covers catalog', () => {
    const man = JSON.parse(fs.readFileSync(journeysManifest, 'utf8'));
    expect(man.journeys.length).toBeGreaterThanOrEqual(11);
    const ids = man.journeys.map((j) => j.id);
    for (const id of [
      'visitor',
      'auth',
      'onboarding',
      'broker',
      'dashboard',
      'strategies',
      'ai_coach',
      'billing',
      'settings',
      'marketplace',
      'error_recovery',
    ]) {
      expect(ids, id).toContain(id);
    }
  });

  test('root meta docs exist', () => {
    for (const name of [
      'README.md',
      'IMPLEMENTATION_SUMMARY.md',
      'EXIT_CRITERIA.md',
      'FROZEN.md',
    ]) {
      expect(fs.existsSync(path.join(phase1, name)), name).toBeTruthy();
      expect(fs.statSync(path.join(phase1, name)).size).toBeGreaterThan(40);
    }
  });

  test('authenticated freeze run has JWT evidence', () => {
    const results = JSON.parse(
      fs.readFileSync(path.join(phase1, 'data/journey-results.json'), 'utf8'),
    );
    expect(results.hasJwt).toBeTruthy();
    expect(results.summary?.complete ?? 0).toBeGreaterThanOrEqual(30);
  });

  test('all report markdown files exist', () => {
    for (const name of REQUIRED_REPORTS) {
      const p = path.join(phase1, 'reports', name);
      expect(fs.existsSync(p), name).toBeTruthy();
      expect(fs.statSync(p).size).toBeGreaterThan(40);
    }
  });

  test('required data files exist', () => {
    for (const name of REQUIRED_DATA) {
      const p = path.join(phase1, 'data', name);
      expect(fs.existsSync(p), name).toBeTruthy();
      expect(fs.statSync(p).size).toBeGreaterThan(10);
    }
  });
});
