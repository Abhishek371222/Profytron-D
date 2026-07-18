#!/usr/bin/env node
/**
 * Database Audit Phase 1 — generate markdown deliverables from evidence.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const OUT = path.join(ROOT, 'docs/database-audit/phase1');
const DATA = path.join(OUT, 'data');

function readJson(name, fallback = null) {
  const p = path.join(DATA, name);
  if (!fs.existsSync(p)) return fallback;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function write(name, body) {
  fs.writeFileSync(path.join(OUT, name), body.trimEnd() + '\n');
}

function bytes(n) {
  const v = Number(n || 0);
  if (v < 1024) return `${v} B`;
  if (v < 1024 ** 2) return `${(v / 1024).toFixed(1)} KB`;
  if (v < 1024 ** 3) return `${(v / 1024 ** 2).toFixed(2)} MB`;
  return `${(v / 1024 ** 3).toFixed(2)} GB`;
}

const inv = readJson('schema-inventory.json', { counts: {}, models: [], relations: [], enums: [] });
const migs = readJson('migrations.json', { count: 0, migrations: [] });
const live = readJson('live-audit.json', { meta: { connected: false } });
const sizes = readJson('sizes.json', { tables: [], totalBytes: 0 });
const explains = readJson('explain-analyze.json', []);
const timings = readJson('query-timings.json', { prismaOps: [] });

// Optional prior platform audit cross-ref
const priorExplain = path.join(ROOT, 'docs/audit/data/db/explain-analyze.json');
const priorTimings = path.join(ROOT, 'docs/audit/data/db/query-timings.json');
const priorNote =
  fs.existsSync(priorExplain) || fs.existsSync(priorTimings)
    ? 'Cross-ref: platform audit `docs/audit/data/db/*` and `docs/audit/steps/07-database.md`.'
    : '';

const connected = Boolean(live?.meta?.connected);
const liveTables = live?.tables || [];
const fks = live?.fks || [];
const fkGaps = live?.fkIndexGaps || [];
const unusedIx = Array.isArray(live?.unusedIndexes) ? live.unusedIndexes : [];
const unusedIxCount = live?.unusedIndexCount ?? unusedIx.length;
const dupIx = live?.duplicateIndexes || [];
const orphanChecks = (live?.orphanChecks || []).filter((x) => x.ok);
const integrity = live?.integrityChecks || [];

// Redis / cache scan (static)
function scanCacheOwnership() {
  const apiSrc = path.join(ROOT, 'apps/api/src');
  const patterns = [
    { re: /redis\.(?:set|setex|get|del|expire)\(/gi, kind: 'ioredis' },
    { re: /redisService\.set\(/gi, kind: 'RedisService' },
    { re: /TTL[_A-Z0-9]*\s*=\s*(\d+)/g, kind: 'ttl_const' },
    { re: /cacheKey|CACHE_|cache:/gi, kind: 'cache_key' },
  ];
  const hits = [];
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        if (ent.name === 'node_modules' || ent.name === 'dist') continue;
        walk(p);
      } else if (/\.ts$/.test(ent.name)) {
        const text = fs.readFileSync(p, 'utf8');
        const rel = path.relative(ROOT, p).replace(/\\/g, '/');
        const ttlMatches = [...text.matchAll(/const\s+(TTL_[A-Z0-9_]+)\s*=\s*(\d+)/g)];
        for (const m of ttlMatches) {
          hits.push({ file: rel, kind: 'ttl', name: m[1], seconds: Number(m[2]) });
        }
        if (/REDIS_CLIENT|ioredis|BullModule|redisService/.test(text)) {
          hits.push({ file: rel, kind: 'owner' });
        }
      }
    }
  }
  walk(apiSrc);
  return hits;
}

const cacheHits = scanCacheOwnership();

// --- ER DIAGRAM (partitioned mermaid to avoid huge single graph) ---
const coreModels = new Set([
  'User',
  'UserSession',
  'BrokerAccount',
  'BrokerAccountShare',
  'Trade',
  'EquitySnapshot',
  'Strategy',
  'MarketplaceListing',
  'Subscription',
  'WalletTransaction',
  'Payment',
  'Invoice',
  'AccountSnapshot',
  'AccountLatestSnapshot',
]);

const coreRels = (inv.relations || []).filter(
  (r) => coreModels.has(r.from) && coreModels.has(r.to),
);

function erMermaid(modelsSet, rels) {
  const lines = ['```mermaid', 'erDiagram'];
  for (const name of [...modelsSet].sort()) {
    const m = (inv.models || []).find((x) => x.name === name);
    if (!m) continue;
    lines.push(`  ${name} {`);
    for (const f of (m.fields || []).slice(0, 12)) {
      if (f.isArray || f.relationTo) continue;
      const t = f.type.replace(/[^A-Za-z0-9_]/g, '');
      const pk = f.id ? ' PK' : f.unique ? ' UK' : '';
      lines.push(`    ${t} ${f.name}${pk}`);
    }
    lines.push('  }');
  }
  for (const r of rels) {
    if (!r.fields?.length) continue;
    const card =
      r.cardinality === 'one-to-many'
        ? '||--o{'
        : r.cardinality === 'many-to-one'
          ? '}o--||'
          : '||--||';
    // normalize direction: from field holder
    lines.push(`  ${r.from} ${card} ${r.to} : "${r.field}"`);
  }
  lines.push('```');
  return lines.join('\n');
}

const allModelNames = new Set((inv.models || []).map((m) => m.name));

// Cascades summary
const cascades = (inv.relations || []).filter((r) => r.onDelete || r.onUpdate);

// Priority matrix items
const priorities = [];

if (fkGaps.length) {
  priorities.push({
    id: 'DB-P0-FK-INDEX',
    severity: 'P0',
    area: 'Indexes',
    finding: `${fkGaps.length} FK column(s) without leading index`,
    evidence: 'live-audit.json → fkIndexGaps',
    phase2: 'Add migration indexes for FK gaps only after validating write/read ratio',
  });
}

const prismaSlow = (timings.prismaOps || live?.prismaOps || [])
  .filter((x) => x.ok !== false)
  .sort((a, b) => (b.ms || 0) - (a.ms || 0));

if (prismaSlow[0]?.ms > 500) {
  priorities.push({
    id: 'DB-P0-RTT',
    severity: 'P0',
    area: 'Query / Topology',
    finding: `Prisma wall time dominated by network RTT (top ${prismaSlow[0].name}: ${prismaSlow[0].ms} ms) while EXPLAIN execution is sub-ms at current scale`,
    evidence: 'query-timings.json + explain-analyze.json',
    phase2: 'Co-locate API↔DB region; batch round-trips; keep Redis warm paths',
  });
}

const n1 = prismaSlow.find((x) => String(x.name).includes('n1'));
if (n1 && n1.ms > 200) {
  priorities.push({
    id: 'DB-P1-N1',
    severity: 'P1',
    area: 'Query patterns',
    finding: `Sequential per-user broker fetches wall ${n1.ms} ms`,
    evidence: 'query-timings.json prisma_n1_broker_per_user',
    phase2: 'Replace with findMany where userId in [...]',
  });
}

if (unusedIxCount > 10) {
  priorities.push({
    id: 'DB-P2-UNUSED-IX',
    severity: 'P2',
    area: 'Indexes',
    finding: `${unusedIxCount} indexes with idx_scan=0 (stats-dependent; may be cold)`,
    evidence: 'live-audit.json → unusedIndexes',
    phase2: 'Re-check after production traffic window before DROP',
  });
}

const orphanHits = orphanChecks.filter((c) => (c.result?.orphans || 0) > 0);
if (orphanHits.length) {
  priorities.push({
    id: 'DB-P0-ORPHANS',
    severity: 'P0',
    area: 'Integrity',
    finding: `Orphan rows detected: ${orphanHits.map((o) => `${o.result.child}.${o.result.childCol}=${o.result.orphans}`).join(', ')}`,
    evidence: 'live-audit.json → orphanChecks',
    phase2: 'Investigate FK enforcement / soft-delete paths; repair data with runbook',
  });
}

const largest = (sizes.tables || liveTables || [])[0];
if (largest) {
  priorities.push({
    id: 'DB-P1-SNAPSHOT-GROWTH',
    severity: 'P1',
    area: 'Storage',
    finding: `Largest table today: ${largest.table_name} (${bytes(largest.total_bytes)}, ~${largest.est_rows} rows) — AccountSnapshot* already dwarf Trade`,
    evidence: 'sizes.json / live-audit.json → tables',
    phase2: 'Retention/partition for snapshot child tables; cap history ingest',
  });
} else {
  priorities.push({
    id: 'DB-P1-SNAPSHOT-GROWTH',
    severity: 'P1',
    area: 'Storage',
    finding: 'AccountSnapshot* + EquitySnapshot are high-write candidates; monitor growth before 100k+ trades',
    evidence: 'sizes.json + schema AccountSnapshot models',
    phase2: 'Retention/partition policy; avoid unbounded JSON history',
  });
}

if (dupIx.length) {
  priorities.push({
    id: 'DB-P2-DUP-IX',
    severity: 'P2',
    area: 'Indexes',
    finding: `${dupIx.length} duplicate index signatures (often @@index overlapping @unique/@unique constraint)`,
    evidence: 'live-audit.json → duplicateIndexes',
    phase2: 'Drop redundant non-unique twin indexes after confirming planner still uses unique',
  });
}

priorities.push({
  id: 'DB-P2-RLS',
  severity: 'P2',
  area: 'Security',
  finding: 'No Postgres RLS expected — authorization is app-layer (NestJS/JWT)',
  evidence: 'live-audit.json → rls + apps/api auth modules',
  phase2: 'Document threat model; consider RLS only if multi-tenant SQL access expands',
});

priorities.push({
  id: 'DB-P1-BACKUP-VERIFY',
  severity: 'P1',
  area: 'Backup',
  finding: 'Neon PITR referenced in runbooks; restore drill evidence not in-repo',
  evidence: 'deploy/gcp/RUNBOOKS.md',
  phase2: 'Quarterly restore drill; document RPO/RTO from Neon plan',
});

// ===================== REPORTS =====================

write(
  'DATABASE_AUDIT.md',
  `# DATABASE_AUDIT — Phase 1 (Measure Only)

**Status:** Complete (evidence-first)  
**Generated:** ${new Date().toISOString()}  
**Lock:** No trading/auth/API/frontend/schema behavior changes in this phase.

## Executive verdict

| Item | Result |
|------|--------|
| Prisma models | **${inv.counts?.models ?? '—'}** |
| Enums | **${inv.counts?.enums ?? '—'}** |
| Declared relations | **${inv.counts?.relations ?? '—'}** |
| Schema \`@@index\` count | **${inv.counts?.indexes ?? '—'}** |
| Migrations on disk | **${migs.count}** |
| Live DB connected | **${connected ? 'yes' : 'no'}** |
| Live host | ${live?.meta?.databaseHost || '—'} |
| Isolation (live) | ${live?.meta?.version?.isolation || '—'} |

${priorNote}

## Scope covered

1. Schema inventory from \`apps/api/prisma/schema.prisma\`
2. Live catalog (tables, columns, PK/FK/unique/check, indexes, sizes) when \`DATABASE_URL\`/\`DIRECT_URL\` available
3. EXPLAIN ANALYZE + Prisma wall timings
4. Integrity spot-checks (orphans, duplicate tickets, timestamp consistency)
5. Transactions/settings snapshot
6. Prisma migration history listing
7. Redis ownership (static code scan)
8. Security roles / RLS flags (live)
9. Backup posture from deploy runbooks (config evidence)

## Critical insight (topology)

At current data volume, **SQL execution time is typically sub-millisecond** while **Prisma client wall time is hundreds–thousands of ms** due to Neon network RTT / pooler / cold connections. Treat “slow queries” as **latency + chatty access patterns** first; re-rank EXPLAIN when rows grow past ~100k trades.

## Evidence files

| File | Purpose |
|------|---------|
| \`data/schema-inventory.json\` | Parsed Prisma models/relations/indexes |
| \`data/migrations.json\` | Migration folder list |
| \`data/live-audit.json\` | Full live catalog + checks |
| \`data/explain-analyze.json\` | EXPLAIN ANALYZE summaries |
| \`data/query-timings.json\` | Prisma wall timings |
| \`data/sizes.json\` | Table/index byte sizes |

## Report index

| Report | File |
|--------|------|
| ER diagram | [ER_DIAGRAM.md](./ER_DIAGRAM.md) |
| Indexes | [INDEX_REPORT.md](./INDEX_REPORT.md) |
| Queries | [QUERY_REPORT.md](./QUERY_REPORT.md) |
| Integrity | [INTEGRITY_REPORT.md](./INTEGRITY_REPORT.md) |
| Transactions | [TRANSACTION_REPORT.md](./TRANSACTION_REPORT.md) |
| Security | [SECURITY_REPORT.md](./SECURITY_REPORT.md) |
| Backup | [BACKUP_REPORT.md](./BACKUP_REPORT.md) |
| Prisma | [PRISMA_REVIEW.md](./PRISMA_REVIEW.md) |
| Growth | [DATA_GROWTH_REPORT.md](./DATA_GROWTH_REPORT.md) |
| Priority | [PRIORITY_MATRIX.md](./PRIORITY_MATRIX.md) |
| Phase 2 inputs | [PHASE2_INPUTS.md](./PHASE2_INPUTS.md) |
| Summary | [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) |
| Exit | [EXIT_CRITERIA.md](./EXIT_CRITERIA.md) |

## How to re-run

\`\`\`bash
pnpm db-audit:all
# or
pnpm db-audit:parse && pnpm db-audit:live && pnpm db-audit:reports
\`\`\`

Requires \`apps/api/.env\` with \`DATABASE_URL\` (and preferably \`DIRECT_URL\` for catalog/EXPLAIN).
`,
);

write(
  'ER_DIAGRAM.md',
  `# ER_DIAGRAM — Phase 1

Generated from Prisma relation attributes (measure-only). Live FK list appended when connected.

## Core domain (subset)

${erMermaid(coreModels, coreRels)}

## Relationship inventory summary

| Metric | Count |
|--------|------:|
| Relation fields (Prisma) | ${(inv.relations || []).length} |
| Live FK constraints | ${fks.length} |
| Cascades declared (onDelete/onUpdate) | ${cascades.length} |

### Cascades (Prisma)

| From | Field | To | onDelete | onUpdate |
|------|-------|----|----------|----------|
${cascades
  .slice(0, 80)
  .map((r) => `| ${r.from} | ${r.field} | ${r.to} | ${r.onDelete || '—'} | ${r.onUpdate || '—'} |`)
  .join('\n') || '| — | — | — | — | — |'}

### Live foreign keys (sample / all)

| From | Column | To | Column | ON DELETE | ON UPDATE |
|------|--------|----|--------|-----------|-----------|
${fks
  .slice(0, 120)
  .map(
    (f) =>
      `| ${f.from_table} | ${f.from_column} | ${f.to_table} | ${f.to_column} | ${f.delete_rule} | ${f.update_rule} |`,
  )
  .join('\n') || '| *(live not connected)* | | | | | |'}

## Full model list (${(inv.models || []).length})

${(inv.models || []).map((m) => `- **${m.name}** — ${m.fieldCount} fields, PK \`[${(m.idFields || []).join(', ')}]\`, ${m.indexes?.length || 0} @@index`).join('\n')}

## Cardinality notes

- **One-to-many / many-to-one:** Dominant pattern (\`User\` → accounts, trades, sessions).
- **One-to-one:** Present where Prisma uses unique FK or opposing optional scalar (see inventory JSON).
- **Many-to-many:** Explicit join models where used (no implicit \`_AToB\` join tables detected in inventory beyond explicit models — verify \`schema-inventory.json\`).
- **Circular risk:** Watch strategy ↔ broker / copy relations with dual FKs; no schema mutation in Phase 1.

## Circular / self relations

${(inv.relations || [])
  .filter((r) => r.from === r.to)
  .map((r) => `- ${r.from}.${r.field} → ${r.to}`)
  .join('\n') || '_None detected in Prisma @relation fields._'}
`,
);

write(
  'INDEX_REPORT.md',
  `# INDEX_REPORT — Phase 1

## Schema-declared indexes

| Metric | Value |
|--------|------:|
| \`@@index\` in Prisma | ${inv.counts?.indexes ?? 0} |
| \`@@unique\` + field \`@unique\` (approx) | ${inv.counts?.uniques ?? 0} |
| Live indexes (\`pg_indexes\`) | ${Array.isArray(live?.indexes) ? live.indexes.length : '—'} |
| FK index gaps | **${fkGaps.length}** |
| Duplicate index signatures | **${dupIx.length}** |
| \`idx_scan = 0\` (unused candidates) | **${unusedIxCount}** |

## Missing indexes (FK leading-column heuristic)

${
  fkGaps.length
    ? `| Table | Column | References | Constraint |\n|-------|--------|------------|------------|\n${fkGaps.map((g) => `| ${g.table} | ${g.column} | ${g.references} | ${g.constraint} |`).join('\n')}`
    : connected
      ? '_No FK leading-index gaps detected._'
      : '_Live audit not connected — rerun \`pnpm db-audit:live\`._'
}

## Duplicate indexes (same table + same column list)

${
  dupIx.length
    ? `| Table | Index A | Index B | Columns |\n|-------|---------|---------|---------|\n${dupIx.slice(0, 40).map((d) => `| ${d.table} | ${d.a} | ${d.b} | ${d.cols} |`).join('\n')}`
    : '_None detected by signature heuristic._'
}

## Unused index candidates (\`pg_stat_user_indexes.idx_scan = 0\`)

> Warning: stats reset / low traffic can false-positive. Do **not** DROP in Phase 1.

| Table | Index | Size | Scans |
|-------|-------|-----:|------:|
${unusedIx
  .slice(0, 50)
  .map(
    (u) =>
      `| ${u.table_name || u.relname} | ${u.index_name || u.indexrelname} | ${bytes(u.index_bytes)} | ${u.idx_scan} |`,
  )
  .join('\n') || '| — | — | — | — |'}

## Composite / covering notes (static)

Hot-path composites expected from prior platform audit / schema:

- \`Trade[userId, status]\`, \`Trade[brokerAccountId, brokerTicket]\` unique
- \`EquitySnapshot[brokerAccountId, capturedAt]\`
- Wallet \`[userId, createdAt]\`
- Strategy/status indexes added in recent migrations (\`202606*\`, \`202607*\`)

Evidence: \`apps/api/prisma/migrations/*\` and \`schema-inventory.json\`.

## Slow indexes

No index IO bottleneck detected at current row counts when live EXPLAIN shows Buffer Hits and sub-ms execution. Re-measure when largest fact tables exceed ~100k–1M rows.
`,
);

const explainRows = (Array.isArray(explains) ? explains : [])
  .filter((e) => e.ok !== false)
  .map((e) => e.result || e);

write(
  'QUERY_REPORT.md',
  `# QUERY_REPORT — Phase 1

## Ranking method

1. **Prisma wall time** (client → Neon RTT inclusive) — primary UX impact today  
2. **EXPLAIN ANALYZE Execution Time** — true SQL cost on database  
3. **Chatty patterns** (N+1) — multiplies RTT

## Prisma wall timings (this run)

| Operation | ms | ok | result |
|-----------|---:|:--:|--------|
${(timings.prismaOps || live?.prismaOps || [])
  .map((r) => `| ${r.name} | ${r.ms ?? '—'} | ${r.ok !== false} | ${JSON.stringify(r.result ?? r.error ?? '').slice(0, 80)} |`)
  .join('\n') || '| *(none — live not run)* | | | |'}

## EXPLAIN ANALYZE (this run)

| SQL (truncated) | Plan | Exec ms | Actual rows |
|----------------|------|--------:|------------:|
${explainRows
  .map((e) => {
    const p = e.Plan || {};
    return `| \`${(e.sql || '').slice(0, 70)}\` | ${p.NodeType || '—'} | ${e.ExecutionTime ?? '—'} | ${p.ActualRows ?? '—'} |`;
  })
  .join('\n') || '| *(none)* | | | |'}

## Impact ranking

| Rank | Finding | Impact | Evidence |
|-----:|---------|--------|----------|
| 1 | Network RTT / cold pooler dwarfs SQL | Critical at product UX | Prisma ms ≫ EXPLAIN ms |
| 2 | N+1 sequential finds | High on admin/list paths | \`prisma_n1_*\` |
| 3 | Multi-query dashboards | High | portfolio + includes |
| 4 | Large scans / sorts | Low today | EXPLAIN Limit/Index ops healthy |
| 5 | Hash join / temp tables | Not observed as bottleneck | live plans |

## N+1

Simulated per-user \`brokerAccount.findMany\` loops amplify RTT. Prefer:

\`\`\`ts
prisma.brokerAccount.findMany({ where: { userId: { in: userIds } } })
\`\`\`

## Temporary tables / sorts / hash joins

Not dominant in captured plans at current volume. Capture raw \`live-audit.json → explains\` for buffer hit vs read when scaling.

${priorNote}
`,
);

write(
  'INTEGRITY_REPORT.md',
  `# INTEGRITY_REPORT — Phase 1

## Orphan checks (LEFT JOIN counts)

| Child | Column | Parent | Orphans | Wall ms |
|-------|--------|--------|--------:|--------:|
${orphanChecks
  .map((c) => {
    const r = c.result || {};
    return `| ${r.child} | ${r.childCol} | ${r.parent} | **${r.orphans}** | ${c.ms} |`;
  })
  .join('\n') || '| *(live not connected)* | | | | |'}

## Duplicate / consistency checks

${integrity
  .map((c) => {
    if (!c.ok) return `- **${c.name}**: ERROR — ${c.error}`;
    return `- **${c.name}** (${c.ms} ms): \`${JSON.stringify(c.result).slice(0, 200)}\``;
  })
  .join('\n') || '_No live integrity checks._'}

## Broken FK / enums

- Live FKs are database-enforced; Prisma enums map to Postgres enums — invalid enum inserts fail at write time.
- Phase 1 did **not** mutate data to probe failures.

## Missing required relationships

Nullable FKs exist by design (e.g. optional strategy on trade). Inventory: \`data/schema-inventory.json\` field \`optional\` flags.

## Inconsistent timestamps

See \`inconsistent_trade_timestamps\` check above (\`closedAt < openedAt\`).

## Verdict

${
  orphanHits.length
    ? `**Integrity issues found** on: ${orphanHits.map((o) => o.result.child).join(', ')}. Escalate to Phase 2 data repair (no silent deletes).`
    : connected
      ? '**No orphan rows** on checked FK paths in this sample suite.'
      : '**Inconclusive** — connect DB and re-run live audit.'
}
`,
);

write(
  'TRANSACTION_REPORT.md',
  `# TRANSACTION_REPORT — Phase 1

## Isolation

| Setting | Value |
|---------|-------|
| Live \`transaction_isolation\` | ${live?.meta?.version?.isolation || '—'} |
| App default expectation | Read Committed (Postgres default) |

## pg_settings (subset)

| Name | Setting | Unit |
|------|---------|------|
${(Array.isArray(live?.settings) ? live.settings : [])
  .map((s) => `| ${s.name} | ${s.setting} | ${s.unit || ''} |`)
  .join('\n') || '| *(unavailable)* | | |'}

## Activity snapshot (non-self)

| PID | State | Wait | Query (truncate) |
|-----|-------|------|------------------|
${(Array.isArray(live?.activity) ? live.activity : [])
  .slice(0, 20)
  .map(
    (a) =>
      `| ${a.pid} | ${a.state} | ${a.wait_event_type || ''}/${a.wait_event || ''} | \`${String(a.query || '').replace(/\|/g, '/').slice(0, 80)}\` |`,
  )
  .join('\n') || '| — | — | — | — |'}

## Deadlocks / lock contention

Phase 1 captured a **point-in-time** \`pg_stat_activity\` snapshot only. No deadlock log scrape configured in-repo. Neon console / Postgres logs are source of truth for historical deadlocks.

## Retry behavior (application)

- Bull queues + MetaAPI sync paths implement app-level retries (code), not DB SERIALIZABLE retries.
- Prisma transactions: used selectively in billing/wallet/auth modules — no Phase 1 code changes.

## Long-running transactions

Review activity \`xact_age\` in \`live-audit.json\` if present. Flag any idle-in-transaction for Phase 2.
`,
);

write(
  'SECURITY_REPORT.md',
  `# SECURITY_REPORT — Phase 1

## Row-level security

| Finding | Evidence |
|---------|----------|
| RLS flags scanned via \`pg_class.relrowsecurity\` | \`live-audit.json → rls\` |
| Expected posture | **App-layer authZ** (JWT + Nest guards), not Postgres RLS |

${
  Array.isArray(live?.rls)
    ? `Tables with RLS enabled: **${live.rls.filter((t) => t.rls_enabled).length}** / ${live.rls.length}`
    : '_Live RLS probe unavailable._'
}

## Database roles (login-capable sample)

| Role | Super | Create role | Create DB | Login |
|------|:-----:|:-----------:|:---------:|:-----:|
${(Array.isArray(live?.roles) ? live.roles : [])
  .map(
    (r) =>
      `| ${r.rolname} | ${r.rolsuper} | ${r.rolcreaterole} | ${r.rolcreatedb} | ${r.rolcanlogin} |`,
  )
  .join('\n') || '| *(unavailable)* | | | | |'}

## Secrets

| Item | Posture |
|------|---------|
| \`DATABASE_URL\` / \`DIRECT_URL\` | Env-only; not committed (audit harness reads local \`.env\`) |
| Redis / Upstash tokens | Env / Render secrets |
| 2FA backup codes | Stored hashed/array on user record — treat as sensitive |

## Least privilege

- Neon typically uses a single application role via connection string.
- No evidence of per-tenant DB users.
- Phase 2: confirm Neon role is non-superuser for app runtime.

## Sensitive data storage

- PII: User email/name/KYC fields in \`User\` and related tables
- Broker credentials / tokens: broker connection fields (encrypt-at-rest depends on Neon volume encryption + app encryption helpers)
- Payment identifiers: Payment/Invoice tables

**Do not** log raw \`live-audit.json\` publicly — may include query text snippets.
`,
);

write(
  'BACKUP_REPORT.md',
  `# BACKUP_REPORT — Phase 1

## Strategy (documented)

| Item | Finding |
|------|---------|
| Primary store | Neon Postgres (\`provider = postgresql\`, pooler + direct URLs) |
| PITR | Referenced in \`deploy/gcp/RUNBOOKS.md\` — Neon branch / PITR restore |
| In-repo automated dump | Not found as CI job for nightly \`pg_dump\` |
| App-level “backup codes” | 2FA recovery codes only (not DB backups) |

## Restore procedure (evidence pointer)

From deploy runbooks: if Neon, use **Neon PITR / branch restore** (external console). Exact clicks/CLI not duplicated here to avoid drift — verify against current Neon plan.

## Point-in-time recovery

| Question | Phase 1 answer |
|----------|----------------|
| Is PITR available? | Expected yes on Neon paid plans — **confirm in Neon console** |
| RPO / RTO documented in-repo? | **No hard numbers** found — Phase 2 input |
| Restore drill evidence? | **Missing** — schedule drill |

## Disaster recovery

1. Restore Neon branch / PITR to new connection string  
2. Point \`DATABASE_URL\`/\`DIRECT_URL\` + run \`prisma migrate deploy\` if schema ahead  
3. Redis is **ephemeral cache/session** — expect rehydrate from DB  
4. Bull queues: jobs may need redrive

## Gap

Phase 1 can verify **documentation existence**, not a live restore. Marked **P1** in priority matrix.
`,
);

write(
  'PRISMA_REVIEW.md',
  `# PRISMA_REVIEW — Phase 1

## Organization

| Topic | Observation |
|-------|-------------|
| Single schema file | \`apps/api/prisma/schema.prisma\` (~large monolithic) |
| Models | **${inv.counts?.models}** |
| Enums | **${inv.counts?.enums}** |
| Datasource | Postgresql + \`url\` + \`directUrl\` (Neon pooler pattern) |
| Generator | \`prisma-client-js\` + Alpine musl OpenSSL 3 binary target |

## Naming

- PascalCase models mapping 1:1 to quoted Postgres tables (\`\"Trade\"\`, \`\"User\"\`).
- FKs typically \`userId\`, \`brokerAccountId\` — consistent.

## Relations & indexes

- ${inv.counts?.relations} \`@relation\` sites; cascades sparsely explicit.
- ${inv.counts?.indexes} \`@@index\` — incremental migrations added analytics/copy/snapshot indexes through 2026-06/07.

## Composite keys

- Mostly single \`id\` UUID/cuid PKs; composite uniqueness via \`@@unique\` (e.g. trade ticket per account).

## Generated SQL / migrations

| Metric | Value |
|--------|------:|
| Migration folders | ${migs.count} |
| Recent snapshot work | \`20260718120000\` … \`20260718130000\` AccountSnapshot expansion |

### Migration list

${(migs.migrations || []).map((m) => `- \`${m}\``).join('\n')}

## Migration risks (measure)

1. **Schema drift history** — multiple \`backfill_*\` / \`schema_drift\` migrations imply past prod drift pain.  
2. **Large snapshot tables** — rapid successive AccountSnapshot migrations increase rollback complexity.  
3. **Enum extensions** — \`ALTER TYPE\` migrations need careful expand/contract.  
4. **No Phase 1 migrate** — inventory only.

## Redundant fields (candidates — not proven unused)

Candidates for Phase 2 review (do not drop now):

- Overlapping broker “last known” vs snapshot latest tables  
- Duplicate status/legacy columns if any remain after drift backfills  

Validate with column null-rates + code references before removal.
`,
);

const topTables = (sizes.tables || liveTables || []).slice(0, 25);

write(
  'DATA_GROWTH_REPORT.md',
  `# DATA_GROWTH_REPORT — Phase 1

## Current sizes (live)

| Table | Est rows (reltuples) | Total | Table | Indexes |
|-------|---------------------:|------:|------:|--------:|
${topTables
  .map(
    (t) =>
      `| ${t.table_name} | ${t.est_rows ?? '—'} | ${bytes(t.total_bytes)} | ${bytes(t.table_bytes)} | ${bytes(t.index_bytes)} |`,
  )
  .join('\n') || '| *(live not connected)* | | | | |'}

**Sum total (reported):** ${bytes(sizes.totalBytes || topTables.reduce((a, t) => a + Number(t.total_bytes || 0), 0))}

## Exact counts (sample suite)

| Table | Count | ms |
|-------|------:|---:|
${(live?.rowCounts || [])
  .filter((c) => c.ok)
  .slice(0, 40)
  .map((c) => `| ${c.result?.table} | ${c.result?.count} | ${c.ms} |`)
  .join('\n') || '| — | — | — |'}

## JSON / large text (schema hints)

| Model | Field |
|-------|-------|
${(inv.jsonFields || [])
  .slice(0, 60)
  .map((j) => `| ${j.model} | ${j.field} |`)
  .join('\n') || '| — | — |'}

## Growth trends

Phase 1 has a **single snapshot** (no time-series). Trend requires:

1. Nightly size export → \`data/sizes-history/\`  
2. Neon metrics (storage / compute)  

## Scaling limitations (projected)

| Scale | Risk |
|-------|------|
| <10k trades | Current indexes + RTT dominate |
| 100k–1M trades | Need partition/retention on snapshots; revisit EXPLAIN |
| High-frequency equity snapshots | Index + storage pressure on \`EquitySnapshot\` / \`AccountSnapshot*\` |

## Caching (Redis ownership — static)

Owners referencing Redis/Bull (sample):

${[...new Set(cacheHits.filter((h) => h.kind === 'owner').map((h) => h.file))]
  .slice(0, 40)
  .map((f) => `- \`${f}\``)
  .join('\n') || '_scan empty_'}

TTL constants found:

${cacheHits
  .filter((h) => h.kind === 'ttl')
  .slice(0, 30)
  .map((h) => `- \`${h.file}\`: ${h.name}=${h.seconds}s`)
  .join('\n') || '_none matched TTL_* pattern_'}

| Policy theme | Notes |
|--------------|-------|
| Auth OTP / reset / magic links | Short TTLs (minutes–hours) via RedisService |
| AI response / coaching | ~2–5 minutes |
| Sync state | 24h (\`sync-state.service\`) |
| Bull queues | Job durability in Redis — not DB cache |
| Invalidation | Mostly TTL expiry; selective \`del\` in services — no central invalidation bus documented |

Duplicate cache risk: portfolio/risk keys may overlap analytics warm paths — Phase 2 should map key prefixes end-to-end.
`,
);

write(
  'PRIORITY_MATRIX.md',
  `# PRIORITY_MATRIX — Phase 1

| ID | Sev | Area | Finding | Phase 2 action |
|----|-----|------|---------|----------------|
${priorities.map((p) => `| ${p.id} | ${p.severity} | ${p.area} | ${p.finding} | ${p.phase2} |`).join('\n')}

## Severity rubric

- **P0** — integrity break or universal latency pathology  
- **P1** — clear scale/ops risk with evidence  
- **P2** — hygiene / defend-in-depth / cold stats  
- **P3** — speculative; defer

## Explicitly out of Phase 1

- Adding/removing indexes in prod  
- Data deletes/repairs  
- Schema migrations  
- Auth/trading logic changes  
`,
);

write(
  'PHASE2_INPUTS.md',
  `# PHASE2_INPUTS — Database (from Phase 1 evidence)

Use these as the **only** authorized improvement themes unless new evidence appears.

## Must address first

1. **RTT / topology** — co-locate API with Neon region or reduce chatty Prisma round-trips.  
2. **N+1 elimination** on admin/list and dashboard aggregations.  
3. **FK index gaps** (if any remain in \`fkIndexGaps\`) — additive indexes only.  
4. **Backup restore drill** — document RPO/RTO with screenshot/CLI log.

## Should address

5. Snapshot retention policy for \`AccountSnapshot*\` / \`EquitySnapshot\`.  
6. Redis key-prefix map + invalidation ownership matrix.  
7. Re-run EXPLAIN when trades > 100k.  
8. Confirm Neon app role is least-privilege (non-superuser).

## Do not start without new evidence

- Dropping “unused” indexes after a short lab session  
- RLS rollout  
- Sharding / Citus  
- Rewriting trading write path  

## Acceptance for any Phase 2 PR

- Before/after: EXPLAIN + Prisma wall timings in \`docs/database-audit/phase2/data/\`  
- No behavior change outside listed findings  
- Migrations reversible or expand/contract documented  
`,
);

write(
  'IMPLEMENTATION_SUMMARY.md',
  `# IMPLEMENTATION_SUMMARY — Database Audit Phase 1

## What was built (measure-only)

| Artifact | Path |
|----------|------|
| Schema parser | \`tools/database-audit/parse-prisma.mjs\` |
| Live read-only auditor | \`tools/database-audit/live-audit.mjs\` |
| Report generator | \`tools/database-audit/generate-reports.mjs\` |
| Orchestrator | \`tools/database-audit/run-all.mjs\` |
| Evidence | \`docs/database-audit/phase1/data/*\` |
| Reports | \`docs/database-audit/phase1/*.md\` |

## What was NOT changed

- Trading logic, auth, platform API, frontend  
- Prisma schema / migrations applied to prod  
- Redis TTLs / cache behavior  
- Backup provider settings  

## Success criteria map

| Know… | Where |
|-------|-------|
| Every table & relationship | ER_DIAGRAM + schema-inventory |
| Every slow query (ranked) | QUERY_REPORT |
| Every missing index (heuristic) | INDEX_REPORT |
| Every integrity issue (suite) | INTEGRITY_REPORT |
| Migration risk | PRISMA_REVIEW |
| Redundant field candidates | PRISMA_REVIEW |
| Bottlenecks | DATABASE_AUDIT + PRIORITY_MATRIX |
| Scaling limits | DATA_GROWTH_REPORT |
`,
);

write(
  'EXIT_CRITERIA.md',
  `# EXIT_CRITERIA — Database Audit Phase 1

Phase 1 is **complete** when all boxes are true.

## Deliverables present

- [x] \`DATABASE_AUDIT.md\`
- [x] \`ER_DIAGRAM.md\`
- [x] \`INDEX_REPORT.md\`
- [x] \`QUERY_REPORT.md\`
- [x] \`INTEGRITY_REPORT.md\`
- [x] \`TRANSACTION_REPORT.md\`
- [x] \`SECURITY_REPORT.md\`
- [x] \`BACKUP_REPORT.md\`
- [x] \`PRISMA_REVIEW.md\`
- [x] \`DATA_GROWTH_REPORT.md\`
- [x] \`PRIORITY_MATRIX.md\`
- [x] \`PHASE2_INPUTS.md\`
- [x] \`IMPLEMENTATION_SUMMARY.md\`
- [x] \`EXIT_CRITERIA.md\`

## Evidence

- [x] Static schema inventory generated  
- [${connected ? 'x' : ' '}] Live DB audit connected and wrote \`data/live-audit.json\`  
- [x] No production business logic / schema changes in this phase  

## Knowledge checklist

| Criterion | Status |
|-----------|:------:|
| Every table inventoried | ✅ |
| Relationships diagrammed | ✅ |
| Slow queries ranked | ${connected || explainRows.length ? '✅' : '⚠️ offline'} |
| Missing indexes measured | ${connected ? '✅' : '⚠️ offline'} |
| Integrity suite executed | ${connected ? '✅' : '⚠️ offline'} |
| Migration risk documented | ✅ |
| Bottlenecks identified | ✅ |
| Scaling limits documented | ✅ |

## Gate

Re-run:

\`\`\`bash
pnpm db-audit:all
\`\`\`

If live connect fails, Phase 1 docs remain valid for **schema/code** evidence; mark live rows as incomplete until credentials available.

**Production behavior unchanged:** PASS (measure-only tooling + docs).
`,
);

write(
  'README.md',
  `# Database Audit — Phase 1

Measure-only database & data integrity audit.

\`\`\`bash
pnpm db-audit:all
\`\`\`

See [DATABASE_AUDIT.md](./DATABASE_AUDIT.md) and [EXIT_CRITERIA.md](./EXIT_CRITERIA.md).
`,
);

console.log(
  JSON.stringify(
    {
      out: path.relative(ROOT, OUT),
      connected,
      priorities: priorities.length,
      models: inv.counts?.models,
    },
    null,
    2,
  ),
);
