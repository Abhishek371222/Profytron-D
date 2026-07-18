/**
 * API Audit Phase 2 artifacts gate.
 */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const phase2 = path.resolve(__dirname, '../../../../docs/api-audit/phase2');

const REQUIRED = [
  'API_OPTIMIZATION.md',
  'SERVICE_OPTIMIZATION.md',
  'SERIALIZATION_REPORT.md',
  'VALIDATION_OPTIMIZATION.md',
  'PAYLOAD_OPTIMIZATION.md',
  'CACHE_GOVERNANCE.md',
  'DEPENDENCY_REDUCTION.md',
  'OPENAPI_COMPLETION.md',
  'WEBSOCKET_OPTIMIZATION.md',
  'API_STANDARDS.md',
  'API_BUDGETS.md',
  'OWNERSHIP_MATRIX.md',
  'VERSIONING_GUIDE.md',
  'SERVICE_GUIDE.md',
  'PERFORMANCE_COMPARISON.md',
  'IMPLEMENTATION_SUMMARY.md',
  'EXIT_CRITERIA.md',
];

test.describe('API Audit Phase 2 artifacts', () => {
  test('all deliverable markdown files exist', () => {
    for (const name of REQUIRED) {
      const p = path.join(phase2, name);
      expect(fs.existsSync(p), name).toBeTruthy();
      expect(fs.statSync(p).size).toBeGreaterThan(40);
    }
  });

  test('before and after latency evidence exist', () => {
    expect(fs.existsSync(path.join(phase2, 'data/before-latency.json'))).toBeTruthy();
    expect(fs.existsSync(path.join(phase2, 'data/after-latency.json'))).toBeTruthy();
    const after = JSON.parse(
      fs.readFileSync(path.join(phase2, 'data/after-latency.json'), 'utf8'),
    );
    expect(after.results?.length).toBeGreaterThanOrEqual(3);
  });

  test('phase1 priority citations present in API_OPTIMIZATION', () => {
    const text = fs.readFileSync(path.join(phase2, 'API_OPTIMIZATION.md'), 'utf8');
    expect(text).toMatch(/PRIORITY_MATRIX|PHASE2_INPUTS|LATENCY_REPORT/);
  });
});
