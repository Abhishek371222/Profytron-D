/**
 * Thin gate: Database Audit Phase 2 artifacts exist.
 */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const phase2 = path.resolve(__dirname, '../../../../docs/database-audit/phase2');

const REQUIRED = [
  'INDEX_OPTIMIZATION.md',
  'PRISMA_OPTIMIZATION.md',
  'N_PLUS_ONE_REPORT.md',
  'SNAPSHOT_POLICY.md',
  'MIGRATION_GUIDE.md',
  'DATABASE_STANDARDS.md',
  'RESTORE_DRILL.md',
  'PERFORMANCE_COMPARISON.md',
  'IMPLEMENTATION_SUMMARY.md',
  'EXIT_CRITERIA.md',
];

test.describe('Database Audit Phase 2 artifacts', () => {
  test('all deliverable markdown reports exist', () => {
    for (const name of REQUIRED) {
      const p = path.join(phase2, name);
      expect(fs.existsSync(p), name).toBeTruthy();
      expect(fs.statSync(p).size).toBeGreaterThan(40);
    }
  });

  test('before/after evidence and index window2 exist', () => {
    for (const name of [
      'before-query-timings.json',
      'after-query-timings.json',
      'index-stats-window2.json',
      'topology.json',
      'snapshot-lifecycle.json',
      'restore-drill.json',
    ]) {
      expect(fs.existsSync(path.join(phase2, 'data', name)), name).toBeTruthy();
    }
  });

  test('FK gaps resolved in after live audit', () => {
    const live = JSON.parse(
      fs.readFileSync(path.join(phase2, 'data/after-live-audit.json'), 'utf8'),
    );
    expect(live.meta?.connected).toBe(true);
    expect(live.fkIndexGaps || []).toHaveLength(0);
  });

  test('batched N+1 probe present in after timings', () => {
    const timings = JSON.parse(
      fs.readFileSync(path.join(phase2, 'data/after-query-timings.json'), 'utf8'),
    );
    const names = (timings.prismaOps || []).map((o: { name: string }) => o.name);
    expect(names).toContain('prisma_batched_broker_by_users');
  });
});
