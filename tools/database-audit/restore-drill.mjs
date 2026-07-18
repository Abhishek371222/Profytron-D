#!/usr/bin/env node
/**
 * Phase 2 Neon branch restore drill.
 * Requires: NEON_API_KEY, NEON_PROJECT_ID, optional NEON_PARENT_BRANCH_ID (default: main/production branch).
 *
 * Flow: create ephemeral branch → integrity SQL → smoke SELECT 1 → delete branch.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const OUT = path.join(ROOT, 'docs/database-audit/phase2/data');

function loadEnv(p) {
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    if (!process.env[m[1]]) process.env[m[1]] = v;
  }
}
loadEnv(path.join(ROOT, 'apps/api/.env'));
loadEnv(path.join(ROOT, '.env'));

fs.mkdirSync(OUT, { recursive: true });

const API_KEY = process.env.NEON_API_KEY?.trim();
const PROJECT_ID = process.env.NEON_PROJECT_ID?.trim();
const PARENT = process.env.NEON_PARENT_BRANCH_ID?.trim();

const evidence = {
  at: new Date().toISOString(),
  ok: false,
  steps: [],
  error: null,
  branchId: null,
  rpoNote: 'Neon branch create copies current parent state (PITR-capable product); RPO ≈ seconds for branch fork',
  rtoNote: 'Measured as wall time from branch create → integrity pass',
};

function step(name, data) {
  evidence.steps.push({ name, at: new Date().toISOString(), ...data });
}

async function neon(method, urlPath, body) {
  const res = await fetch(`https://console.neon.tech/api/v2${urlPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 500) };
  }
  if (!res.ok) {
    const err = new Error(`Neon API ${method} ${urlPath}: ${res.status} ${text.slice(0, 400)}`);
    err.status = res.status;
    err.json = json;
    throw err;
  }
  return json;
}

async function runIntegrity(databaseUrl) {
  const require = createRequire(path.join(ROOT, 'apps/api/package.json'));
  const { PrismaClient } = require('@prisma/client');
  process.env.DATABASE_URL = databaseUrl;
  process.chdir(path.join(ROOT, 'apps/api'));
  const prisma = new PrismaClient();
  const checks = [];
  try {
    await prisma.$connect();
    const t0 = performance.now();
    await prisma.$queryRawUnsafe('SELECT 1 AS ok');
    checks.push({ name: 'select_1', ms: +(performance.now() - t0).toFixed(1), ok: true });

    const orphanSql = `
      SELECT COUNT(*)::bigint AS orphans
      FROM "Trade" c
      LEFT JOIN "User" p ON p.id = c."userId"
      WHERE c."userId" IS NOT NULL AND p.id IS NULL
    `;
    const orphans = await prisma.$queryRawUnsafe(orphanSql);
    checks.push({
      name: 'orphan_trade_user',
      orphans: Number(orphans[0]?.orphans ?? 0),
      ok: Number(orphans[0]?.orphans ?? 0) === 0,
    });

    const dupes = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*)::bigint AS c FROM (
        SELECT 1 FROM "Trade"
        WHERE "brokerTicket" IS NOT NULL
        GROUP BY "brokerAccountId", "brokerTicket"
        HAVING COUNT(*) > 1
      ) x
    `);
    checks.push({
      name: 'dupe_tickets',
      count: Number(dupes[0]?.c ?? 0),
      ok: Number(dupes[0]?.c ?? 0) === 0,
    });
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
  return checks;
}

function connectionUriFromBranch(branchPayload) {
  const endpoints = branchPayload?.endpoints || branchPayload?.branch?.endpoints || [];
  const connection_uris =
    branchPayload?.connection_uris ||
    branchPayload?.branch?.connection_uris ||
    [];
  if (connection_uris[0]?.connection_uri) return connection_uris[0].connection_uri;
  // Fallback: list connection URI via project
  return null;
}

const integrityOnly = process.argv.includes('--integrity-only');

async function main() {
  if (integrityOnly) {
    const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
    if (!url) {
      evidence.error = 'No DATABASE_URL for --integrity-only';
      fs.writeFileSync(path.join(OUT, 'restore-drill.json'), JSON.stringify(evidence, null, 2));
      process.exitCode = 1;
      return;
    }
    const tStart = performance.now();
    step('mode', { mode: 'integrity-only', note: 'No Neon branch; validates integrity suite against current DB' });
    const checks = await runIntegrity(url);
    evidence.checks = checks;
    evidence.rtoMs = +(performance.now() - tStart).toFixed(1);
    evidence.ok = checks.every((c) => c.ok !== false);
    evidence.branchDrill = 'skipped';
    fs.writeFileSync(path.join(OUT, 'restore-drill.json'), JSON.stringify(evidence, null, 2));
    console.log(JSON.stringify({ ok: evidence.ok, mode: 'integrity-only', checks }, null, 2));
    if (!evidence.ok) process.exitCode = 1;
    return;
  }

  if (!API_KEY || !PROJECT_ID) {
    evidence.error =
      'Missing NEON_API_KEY or NEON_PROJECT_ID — set in apps/api/.env to run restore drill (or pass --integrity-only)';
    fs.writeFileSync(path.join(OUT, 'restore-drill.json'), JSON.stringify(evidence, null, 2));
    console.error(evidence.error);
    process.exitCode = 1;
    return;
  }

  const tStart = performance.now();
  let parentId = PARENT;
  if (!parentId) {
    const branches = await neon('GET', `/projects/${PROJECT_ID}/branches`);
    const list = branches.branches || [];
    const primary = list.find((b) => b.primary) || list.find((b) => b.name === 'main') || list[0];
    parentId = primary?.id;
    step('resolve_parent', { parentId, name: primary?.name });
  }

  const name = `db-audit-restore-${Date.now()}`;
  const created = await neon('POST', `/projects/${PROJECT_ID}/branches`, {
    branch: { name, parent_id: parentId },
    endpoints: [{ type: 'read_write' }],
  });
  const branch = created.branch || created;
  evidence.branchId = branch.id;
  step('create_branch', { id: branch.id, name: branch.name });

  let uri = connectionUriFromBranch(created);
  if (!uri) {
    const conn = await neon('GET', `/projects/${PROJECT_ID}/connection_uri?branch_id=${branch.id}&database_name=profytron&role_name=neondb_owner`);
    uri = conn.uri || conn.connection_uri;
  }
  if (!uri) {
    throw new Error('Could not resolve connection URI for ephemeral branch');
  }
  step('resolve_uri', { host: new URL(uri).hostname });

  const checks = await runIntegrity(uri);
  step('integrity_smoke', { checks });
  const integrityOk = checks.every((c) => c.ok !== false);
  evidence.rtoMs = +(performance.now() - tStart).toFixed(1);

  await neon('DELETE', `/projects/${PROJECT_ID}/branches/${branch.id}`);
  step('delete_branch', { id: branch.id });
  evidence.ok = integrityOk;
  evidence.checks = checks;

  fs.writeFileSync(path.join(OUT, 'restore-drill.json'), JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify({ ok: evidence.ok, rtoMs: evidence.rtoMs, checks }, null, 2));
  if (!evidence.ok) process.exitCode = 1;
}

main().catch((e) => {
  evidence.error = String(e.message || e).slice(0, 800);
  fs.writeFileSync(path.join(OUT, 'restore-drill.json'), JSON.stringify(evidence, null, 2));
  console.error(evidence.error);
  process.exitCode = 1;
});
