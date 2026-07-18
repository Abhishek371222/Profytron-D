/**
 * Thin gate: Database Audit Phase 1 artifacts exist (measure-only evidence).
 */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const phase1 = path.resolve(__dirname, '../../../../docs/database-audit/phase1');

const REQUIRED = [
  'DATABASE_AUDIT.md',
  'ER_DIAGRAM.md',
  'INDEX_REPORT.md',
  'QUERY_REPORT.md',
  'INTEGRITY_REPORT.md',
  'TRANSACTION_REPORT.md',
  'SECURITY_REPORT.md',
  'BACKUP_REPORT.md',
  'PRISMA_REVIEW.md',
  'DATA_GROWTH_REPORT.md',
  'PRIORITY_MATRIX.md',
  'PHASE2_INPUTS.md',
  'IMPLEMENTATION_SUMMARY.md',
  'EXIT_CRITERIA.md',
];

test.describe('Database Audit Phase 1 artifacts', () => {
  test('all deliverable markdown reports exist', () => {
    for (const name of REQUIRED) {
      const p = path.join(phase1, name);
      expect(fs.existsSync(p), name).toBeTruthy();
      expect(fs.statSync(p).size).toBeGreaterThan(40);
    }
  });

  test('schema inventory and migrations evidence exist', () => {
    const invPath = path.join(phase1, 'data/schema-inventory.json');
    const migPath = path.join(phase1, 'data/migrations.json');
    expect(fs.existsSync(invPath)).toBeTruthy();
    expect(fs.existsSync(migPath)).toBeTruthy();
    const inv = JSON.parse(fs.readFileSync(invPath, 'utf8'));
    expect(inv.counts.models).toBeGreaterThanOrEqual(50);
    expect(inv.counts.relations).toBeGreaterThan(0);
  });

  test('live audit file records connection meta', () => {
    const livePath = path.join(phase1, 'data/live-audit.json');
    expect(fs.existsSync(livePath)).toBeTruthy();
    const live = JSON.parse(fs.readFileSync(livePath, 'utf8'));
    expect(live.meta).toBeTruthy();
    expect(typeof live.meta.connected).toBe('boolean');
  });
});
