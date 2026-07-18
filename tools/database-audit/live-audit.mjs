#!/usr/bin/env node
/**
 * Database Audit Phase 1 — live read-only Postgres/Neon measures.
 * Never mutates schema or data. Uses EXPLAIN ANALYZE and catalog queries only.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const OUT = path.join(ROOT, 'docs/database-audit/phase1/data');
const require = createRequire(import.meta.url);

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

const meta = {
  at: new Date().toISOString(),
  connected: false,
  error: null,
  usingDirectUrl: Boolean(process.env.DIRECT_URL),
  databaseHost: null,
};

function hostOf(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}
meta.databaseHost = hostOf(process.env.DIRECT_URL || process.env.DATABASE_URL || '');

if (!process.env.DATABASE_URL && !process.env.DIRECT_URL) {
  fs.writeFileSync(
    path.join(OUT, 'live-audit.json'),
    JSON.stringify({ ...meta, error: 'No DATABASE_URL or DIRECT_URL' }, null, 2),
  );
  console.error('No DATABASE_URL — wrote stub live-audit.json');
  process.exit(0);
}

// Prefer DIRECT_URL for catalog/EXPLAIN to avoid pooler limitations
const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
process.env.DATABASE_URL = url;

process.chdir(path.join(ROOT, 'apps/api'));
const { PrismaClient } = createRequire(path.join(ROOT, 'apps/api', 'package.json'))('@prisma/client');
const prisma = new PrismaClient({ log: [{ emit: 'event', level: 'query' }] });
const prismaEvents = [];
prisma.$on('query', (e) => {
  prismaEvents.push({
    sql: String(e.query).slice(0, 240),
    durationMs: Number(e.duration),
  });
});

async function q(sql) {
  return prisma.$queryRawUnsafe(sql);
}

async function timed(name, fn) {
  const t0 = performance.now();
  try {
    const result = await fn();
    return { name, ms: +(performance.now() - t0).toFixed(1), ok: true, result };
  } catch (e) {
    return {
      name,
      ms: +(performance.now() - t0).toFixed(1),
      ok: false,
      error: String(e?.message || e).slice(0, 400),
    };
  }
}

function serialize(v) {
  return JSON.parse(
    JSON.stringify(v, (_k, val) => (typeof val === 'bigint' ? Number(val) : val)),
  );
}

try {
  await prisma.$connect();
  meta.connected = true;

  const version = await q('SELECT version() AS v, current_database() AS db, current_user AS usr, current_setting(\'transaction_isolation\') AS isolation');
  const tables = await q(`
    SELECT c.relname AS table_name,
           pg_total_relation_size(c.oid) AS total_bytes,
           pg_relation_size(c.oid) AS table_bytes,
           pg_indexes_size(c.oid) AS index_bytes,
           c.reltuples::bigint AS est_rows
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    ORDER BY pg_total_relation_size(c.oid) DESC
  `);

  const columns = await q(`
    SELECT table_name, column_name, data_type, udt_name, is_nullable, column_default,
           character_maximum_length
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position
  `);

  const pks = await q(`
    SELECT tc.table_name, kcu.column_name, tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.ordinal_position
  `);

  const fks = await q(`
    SELECT
      tc.table_name AS from_table,
      kcu.column_name AS from_column,
      ccu.table_name AS to_table,
      ccu.column_name AS to_column,
      tc.constraint_name,
      rc.delete_rule,
      rc.update_rule
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints rc
      ON rc.constraint_name = tc.constraint_name AND rc.constraint_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
    ORDER BY tc.table_name
  `);

  const uniques = await q(`
    SELECT tc.table_name, tc.constraint_name, kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'UNIQUE' AND tc.table_schema = 'public'
    ORDER BY tc.table_name, tc.constraint_name, kcu.ordinal_position
  `);

  const checks = await q(`
    SELECT conname AS constraint_name, conrelid::regclass::text AS table_name, pg_get_constraintdef(oid) AS definition
    FROM pg_constraint
    WHERE contype = 'c' AND connamespace = 'public'::regnamespace
  `);

  const indexes = await q(`
    SELECT
      i.schemaname,
      i.tablename,
      i.indexname,
      i.indexdef,
      pg_relation_size(c.oid) AS index_bytes
    FROM pg_indexes i
    JOIN pg_class c ON c.relname = i.indexname
    JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = i.schemaname
    WHERE i.schemaname = 'public'
    ORDER BY i.tablename, i.indexname
  `);

  // Better index sizes via pg_stat_user_indexes
  let indexStats = [];
  try {
    indexStats = await q(`
      SELECT schemaname, relname AS table_name, indexrelname AS index_name,
             idx_scan, idx_tup_read, idx_tup_fetch,
             pg_relation_size(indexrelid) AS index_bytes
      FROM pg_stat_user_indexes
      ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC
    `);
  } catch (e) {
    indexStats = { error: String(e.message) };
  }

  let unusedIndexes = [];
  if (Array.isArray(indexStats)) {
    unusedIndexes = indexStats.filter((r) => Number(r.idx_scan) === 0);
  }

  // Missing FK indexes heuristic: FK columns without leading index
  const fkIndexGaps = [];
  const indexDefs = Array.isArray(indexes) ? indexes : [];
  for (const fk of fks) {
    const col = fk.from_column;
    const covered = indexDefs.some((ix) => {
      if (ix.tablename !== fk.from_table) return false;
      const def = String(ix.indexdef || '');
      // leading column match
      return new RegExp(`\\(${col}[,\\)]`).test(def) || new RegExp(`\\("${col}"[,\\)]`).test(def);
    });
    if (!covered) {
      fkIndexGaps.push({
        table: fk.from_table,
        column: fk.from_column,
        references: `${fk.to_table}.${fk.to_column}`,
        constraint: fk.constraint_name,
      });
    }
  }

  // Duplicate index heuristic: same table + same columns in indexdef
  const bySig = new Map();
  const duplicateIndexes = [];
  for (const ix of indexDefs) {
    const m = String(ix.indexdef).match(/\(([^)]+)\)/);
    const sig = `${ix.tablename}|${(m?.[1] || '').replace(/\s+/g, '')}`;
    if (bySig.has(sig)) {
      duplicateIndexes.push({ a: bySig.get(sig), b: ix.indexname, table: ix.tablename, cols: m?.[1] });
    } else {
      bySig.set(sig, ix.indexname);
    }
  }

  // Integrity: orphan checks for major FKs (read-only counts)
  const orphanChecks = [];
  const orphanTargets = [
    { child: 'Trade', childCol: 'userId', parent: 'User', parentCol: 'id' },
    { child: 'Trade', childCol: 'brokerAccountId', parent: 'BrokerAccount', parentCol: 'id' },
    { child: 'BrokerAccount', childCol: 'userId', parent: 'User', parentCol: 'id' },
    { child: 'EquitySnapshot', childCol: 'brokerAccountId', parent: 'BrokerAccount', parentCol: 'id' },
    { child: 'UserSession', childCol: 'userId', parent: 'User', parentCol: 'id' },
    { child: 'WalletTransaction', childCol: 'userId', parent: 'User', parentCol: 'id' },
    { child: 'Payment', childCol: 'userId', parent: 'User', parentCol: 'id' },
    { child: 'UserSubscription', childCol: 'userId', parent: 'User', parentCol: 'id' },
    { child: 'UserStrategySubscription', childCol: 'userId', parent: 'User', parentCol: 'id' },
    { child: 'AccountSnapshot', childCol: 'brokerAccountId', parent: 'BrokerAccount', parentCol: 'id' },
  ];

  for (const t of orphanTargets) {
    const sql = `
      SELECT COUNT(*)::bigint AS orphans
      FROM "${t.child}" c
      LEFT JOIN "${t.parent}" p ON p."${t.parentCol}" = c."${t.childCol}"
      WHERE c."${t.childCol}" IS NOT NULL AND p."${t.parentCol}" IS NULL
    `;
    orphanChecks.push(
      await timed(`orphan_${t.child}_${t.childCol}`, async () => {
        const rows = await q(sql);
        return { ...t, orphans: Number(rows[0]?.orphans ?? 0) };
      }),
    );
  }

  // Duplicate broker ticket heuristic
  const dupeChecks = [];
  dupeChecks.push(
    await timed('dupe_trade_broker_ticket', async () => {
      const rows = await q(`
        SELECT "brokerAccountId", "brokerTicket", COUNT(*)::bigint AS c
        FROM "Trade"
        WHERE "brokerTicket" IS NOT NULL
        GROUP BY 1, 2
        HAVING COUNT(*) > 1
        LIMIT 50
      `);
      return { count: rows.length, sample: rows.slice(0, 10) };
    }),
  );

  // Timestamp consistency: closed before open
  dupeChecks.push(
    await timed('inconsistent_trade_timestamps', async () => {
      const rows = await q(`
        SELECT COUNT(*)::bigint AS bad
        FROM "Trade"
        WHERE "closedAt" IS NOT NULL AND "openedAt" IS NOT NULL AND "closedAt" < "openedAt"
      `);
      return { bad: Number(rows[0]?.bad ?? 0) };
    }),
  );

  // Table row counts (exact for small tables)
  const rowCounts = [];
  for (const t of serialize(tables).slice(0, 40)) {
    rowCounts.push(
      await timed(`count_${t.table_name}`, async () => {
        const rows = await q(`SELECT COUNT(*)::bigint AS c FROM "${t.table_name}"`);
        return { table: t.table_name, count: Number(rows[0]?.c ?? 0) };
      }),
    );
  }

  // EXPLAIN ANALYZE suite
  const explains = [];
  const explainSqls = [
    `SELECT id FROM "Trade" WHERE "userId" IS NOT NULL AND status = 'CLOSED' ORDER BY "closedAt" DESC NULLS LAST LIMIT 200`,
    `SELECT COUNT(*) FROM "Trade"`,
    `SELECT * FROM "BrokerAccount" LIMIT 20`,
    `SELECT * FROM "EquitySnapshot" ORDER BY "capturedAt" DESC LIMIT 100`,
    `SELECT status, COUNT(*), COALESCE(SUM(profit),0) FROM "Trade" GROUP BY status`,
    `SELECT * FROM "Trade" WHERE status = 'OPEN' LIMIT 50`,
  ];
  for (const sql of explainSqls) {
    explains.push(
      await timed(`explain_${sql.slice(0, 40)}`, async () => {
        const rows = await q(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql}`);
        const plan = rows[0]?.['QUERY PLAN']?.[0] || rows[0]?.['QUERY PLAN'] || rows[0];
        return {
          sql: sql.slice(0, 180),
          PlanningTime: plan?.['Planning Time'] ?? plan?.PlanningTime,
          ExecutionTime: plan?.['Execution Time'] ?? plan?.ExecutionTime,
          Plan: {
            NodeType: plan?.Plan?.['Node Type'],
            TotalCost: plan?.Plan?.['Total Cost'],
            ActualTotalTime: plan?.Plan?.['Actual Total Time'],
            ActualRows: plan?.Plan?.['Actual Rows'],
            SharedHitBlocks: plan?.Plan?.['Shared Hit Blocks'],
            SharedReadBlocks: plan?.Plan?.['Shared Read Blocks'],
          },
        };
      }),
    );
  }

  // Prisma wall timings (RTT-inclusive)
  const prismaOps = [];
  prismaOps.push(await timed('prisma_count_users', () => prisma.user.count()));
  prismaOps.push(await timed('prisma_count_trades', () => prisma.trade.count()));
  prismaOps.push(
    await timed('prisma_open_trades_join', async () => {
      const rows = await prisma.trade.findMany({
        where: { status: 'OPEN' },
        take: 50,
        include: { brokerAccount: true },
      });
      return rows.length;
    }),
  );
  prismaOps.push(
    await timed('prisma_portfolio_style_trades', async () => {
      const u = await prisma.user.findFirst();
      if (!u) return 0;
      return (
        await prisma.trade.findMany({
          where: { userId: u.id, status: 'CLOSED' },
          orderBy: { closedAt: 'desc' },
          take: 200,
        })
      ).length;
    }),
  );
  prismaOps.push(
    await timed('prisma_n1_broker_per_user', async () => {
      const users = await prisma.user.findMany({ take: 10 });
      let n = 0;
      for (const u of users) {
        n += (await prisma.brokerAccount.findMany({ where: { userId: u.id } })).length;
      }
      return { users: users.length, accounts: n };
    }),
  );
  prismaOps.push(
    await timed('prisma_batched_broker_by_users', async () => {
      const users = await prisma.user.findMany({ take: 10 });
      const ids = users.map((u) => u.id);
      const accounts = ids.length
        ? await prisma.brokerAccount.findMany({ where: { userId: { in: ids } } })
        : [];
      return { users: users.length, accounts: accounts.length };
    }),
  );

  // Activity / locks snapshot
  let activity = [];
  try {
    activity = await q(`
      SELECT pid, state, wait_event_type, wait_event,
             now() - xact_start AS xact_age,
             now() - query_start AS query_age,
             left(query, 120) AS query
      FROM pg_stat_activity
      WHERE datname = current_database() AND pid <> pg_backend_pid()
      ORDER BY xact_start NULLS LAST
      LIMIT 30
    `);
  } catch (e) {
    activity = { error: String(e.message) };
  }

  let settings = [];
  try {
    settings = await q(`
      SELECT name, setting, unit
      FROM pg_settings
      WHERE name IN (
        'max_connections','shared_buffers','work_mem','maintenance_work_mem',
        'effective_cache_size','random_page_cost','default_transaction_isolation',
        'statement_timeout','idle_in_transaction_session_timeout','lock_timeout'
      )
    `);
  } catch (e) {
    settings = { error: String(e.message) };
  }

  // Roles (limited)
  let roles = [];
  try {
    roles = await q(`
      SELECT rolname, rolsuper, rolcreaterole, rolcreatedb, rolcanlogin
      FROM pg_roles
      WHERE rolcanlogin = true
      ORDER BY rolname
      LIMIT 40
    `);
  } catch (e) {
    roles = { error: String(e.message) };
  }

  // RLS
  let rls = [];
  try {
    rls = await q(`
      SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS rls_forced
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r'
      ORDER BY c.relname
    `);
  } catch (e) {
    rls = { error: String(e.message) };
  }

  const out = serialize({
    meta: { ...meta, version: version[0] },
    tables,
    columns,
    pks,
    fks,
    uniques,
    checks,
    indexes,
    indexStats,
    unusedIndexes: Array.isArray(unusedIndexes)
      ? unusedIndexes.slice(0, 100)
      : unusedIndexes,
    unusedIndexCount: Array.isArray(unusedIndexes) ? unusedIndexes.length : 0,
    fkIndexGaps,
    duplicateIndexes,
    orphanChecks,
    integrityChecks: dupeChecks,
    rowCounts,
    explains,
    prismaOps,
    prismaQueryEvents: prismaEvents.sort((a, b) => b.durationMs - a.durationMs).slice(0, 80),
    activity,
    settings,
    roles,
    rls,
  });

  fs.writeFileSync(path.join(OUT, 'live-audit.json'), JSON.stringify(out, null, 2));

  // Also mirror key slices for report consumers
  fs.writeFileSync(path.join(OUT, 'explain-analyze.json'), JSON.stringify(explains, null, 2));
  fs.writeFileSync(path.join(OUT, 'query-timings.json'), JSON.stringify({ prismaOps, prismaQueryEvents: out.prismaQueryEvents }, null, 2));
  fs.writeFileSync(
    path.join(OUT, 'sizes.json'),
    JSON.stringify(
      {
        tables: serialize(tables),
        totalBytes: serialize(tables).reduce((a, t) => a + Number(t.total_bytes || 0), 0),
      },
      null,
      2,
    ),
  );

  console.log(
    JSON.stringify(
      {
        connected: true,
        host: meta.databaseHost,
        tables: tables.length,
        fks: fks.length,
        indexes: indexDefs.length,
        fkIndexGaps: fkIndexGaps.length,
        unusedIndexes: Array.isArray(unusedIndexes) ? unusedIndexes.length : 0,
        out: path.relative(ROOT, path.join(OUT, 'live-audit.json')),
      },
      null,
      2,
    ),
  );
} catch (e) {
  meta.connected = false;
  meta.error = String(e?.message || e).slice(0, 800);
  fs.writeFileSync(path.join(OUT, 'live-audit.json'), JSON.stringify({ meta }, null, 2));
  console.error('Live audit failed:', meta.error);
  process.exitCode = 0; // measure-only: still allow static reports
} finally {
  await prisma.$disconnect().catch(() => {});
}
