/**
 * Thin gate: API Audit Phase 1 artifacts exist.
 */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const phase1 = path.resolve(__dirname, '../../../../docs/api-audit/phase1');

const REQUIRED_REPORTS = [
  'ENDPOINT_INVENTORY.md',
  'SERVICE_MAP.md',
  'REQUEST_FLOW_REPORT.md',
  'LATENCY_REPORT.md',
  'PAYLOAD_REPORT.md',
  'VALIDATION_REPORT.md',
  'SERIALIZATION_REPORT.md',
  'ERROR_REPORT.md',
  'AUTHORIZATION_REPORT.md',
  'WEBSOCKET_REPORT.md',
  'OPENAPI_REVIEW.md',
  'CACHE_USAGE_REPORT.md',
  'RATE_LIMIT_REPORT.md',
  'PAGINATION_REPORT.md',
  'DEPENDENCY_GRAPH.md',
  'PRIORITY_MATRIX.md',
  'PHASE2_INPUTS.md',
];

test.describe('API Audit Phase 1 artifacts', () => {
  test('root meta docs exist', () => {
    for (const name of ['README.md', 'IMPLEMENTATION_SUMMARY.md', 'EXIT_CRITERIA.md']) {
      expect(fs.existsSync(path.join(phase1, name)), name).toBeTruthy();
    }
  });

  test('all report markdown files exist', () => {
    for (const name of REQUIRED_REPORTS) {
      const p = path.join(phase1, 'reports', name);
      expect(fs.existsSync(p), name).toBeTruthy();
      expect(fs.statSync(p).size).toBeGreaterThan(40);
    }
  });

  test('endpoints inventory has substantial coverage', () => {
    const inv = JSON.parse(
      fs.readFileSync(path.join(phase1, 'data/endpoints.json'), 'utf8'),
    );
    expect(inv.counts.controllers).toBeGreaterThanOrEqual(30);
    expect(inv.counts.endpoints).toBeGreaterThanOrEqual(200);
  });

  test('websockets and dependencies evidence exist', () => {
    expect(fs.existsSync(path.join(phase1, 'data/websockets.json'))).toBeTruthy();
    expect(fs.existsSync(path.join(phase1, 'data/dependencies.json'))).toBeTruthy();
    const ws = JSON.parse(
      fs.readFileSync(path.join(phase1, 'data/websockets.json'), 'utf8'),
    );
    expect(ws.gateways.length).toBeGreaterThanOrEqual(3);
  });
});
