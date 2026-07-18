/**
 * Product Audit Phase 2 completion artifacts.
 */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const phase2 = path.resolve(__dirname, '../../../../docs/product-audit/phase2');

const REQUIRED = [
  'PRODUCT_STANDARDS.md',
  'MICROCOPY_GUIDE.md',
  'EMPTY_STATE_GUIDE.md',
  'ERROR_GUIDE.md',
  'ONBOARDING_GUIDE.md',
  'PRODUCT_CHECKLIST.md',
  'PRODUCT_COMPLETION.md',
  'USER_JOURNEY_COMPLETION.md',
  'AUTH_COMPLETION.md',
  'BROKER_COMPLETION.md',
  'STRATEGY_COMPLETION.md',
  'AI_COACH_COMPLETION.md',
  'MARKETPLACE_COMPLETION.md',
  'BILLING_COMPLETION.md',
  'SETTINGS_COMPLETION.md',
  'PERFORMANCE_COMPARISON.md',
  'IMPLEMENTATION_SUMMARY.md',
  'EXIT_CRITERIA.md',
];

test.describe('Product Audit Phase 2 artifacts', () => {
  test('phase2 completion docs exist', () => {
    for (const name of REQUIRED) {
      const p = path.join(phase2, name);
      expect(fs.existsSync(p), name).toBeTruthy();
      expect(fs.statSync(p).size).toBeGreaterThan(40);
    }
  });

  test('onboarding welcome is not a bare redirect stub', () => {
    const pagePath = path.resolve(
      __dirname,
      '../../src/app/(public)/onboarding/page.tsx',
    );
    const src = fs.readFileSync(pagePath, 'utf8');
    expect(src.includes("redirect('/onboarding/risk')")).toBeFalsy();
    expect(src.includes('Continue to Risk DNA') || src.includes('Welcome')).toBeTruthy();
  });
});
