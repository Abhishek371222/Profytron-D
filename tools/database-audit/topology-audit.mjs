#!/usr/bin/env node
/**
 * Phase 2 connection topology measure (read-only).
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

function hostOf(url) {
  try {
    const u = new URL(url);
    return { host: u.hostname, hasPooler: u.hostname.includes('-pooler'), search: u.search };
  } catch {
    return { host: null, hasPooler: false, search: '' };
  }
}

fs.mkdirSync(OUT, { recursive: true });
const require = createRequire(path.join(ROOT, 'apps/api/package.json'));
const { PrismaClient } = require('@prisma/client');

const pooled = process.env.DATABASE_URL || '';
const direct = process.env.DIRECT_URL || pooled;

const report = {
  at: new Date().toISOString(),
  pooled: hostOf(pooled),
  direct: hostOf(direct),
  connectMs: {},
  activity: null,
  settings: null,
  guidance: {
    connection_limit: 'Append ?connection_limit=10 (or &connection_limit=10) on Neon pooler DATABASE_URL',
    pool_timeout: 'Optional pool_timeout=10 on Prisma URL',
    region: 'Co-locate API host region with Neon compute (us-east-1 for current project)',
  },
};

async function measureConnect(label, url) {
  process.env.DATABASE_URL = url;
  const prisma = new PrismaClient();
  const t0 = performance.now();
  try {
    await prisma.$connect();
    await prisma.$queryRawUnsafe('SELECT 1 AS ok');
    report.connectMs[label] = +(performance.now() - t0).toFixed(1);
    if (label === 'pooled' || label === 'direct') {
      report.activity = await prisma.$queryRawUnsafe(`
        SELECT state, COUNT(*)::bigint AS c
        FROM pg_stat_activity
        WHERE datname = current_database()
        GROUP BY state
        ORDER BY c DESC
      `);
      report.settings = await prisma.$queryRawUnsafe(`
        SELECT name, setting FROM pg_settings
        WHERE name IN ('max_connections','default_transaction_isolation','statement_timeout')
      `);
    }
  } catch (e) {
    report.connectMs[label] = { error: String(e.message).slice(0, 300) };
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

process.chdir(path.join(ROOT, 'apps/api'));
await measureConnect('pooled', pooled);
if (direct && direct !== pooled) {
  await measureConnect('direct', direct);
}

const ser = JSON.parse(JSON.stringify(report, (_k, v) => (typeof v === 'bigint' ? Number(v) : v)));
fs.writeFileSync(path.join(OUT, 'topology.json'), JSON.stringify(ser, null, 2));
console.log(JSON.stringify(ser, null, 2));
