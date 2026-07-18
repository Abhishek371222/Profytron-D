#!/usr/bin/env node
/**
 * Phase 2 snapshot lifecycle (soft-archive). Default: --dry-run.
 * Does NOT modify Sync Engine writers.
 *
 * Usage:
 *   node tools/database-audit/snapshot-lifecycle.mjs [--dry-run|--apply] [--cleanup]
 *
 * Env:
 *   SNAPSHOT_HOT_KEEP_DAYS (default 14)
 *   SNAPSHOT_ARCHIVE_TTL_DAYS (default 365) — cleanup applies to archive tables only
 *   SNAPSHOT_BATCH_SIZE (default 500)
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const OUT = path.join(ROOT, 'docs/database-audit/phase2/data');
const require = createRequire(path.join(ROOT, 'apps/api/package.json'));

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

const apply = process.argv.includes('--apply');
const cleanup = process.argv.includes('--cleanup');
const dryRun = !apply;
const HOT_KEEP_DAYS = Number(process.env.SNAPSHOT_HOT_KEEP_DAYS || 14);
const ARCHIVE_TTL_DAYS = Number(process.env.SNAPSHOT_ARCHIVE_TTL_DAYS || 365);
const BATCH = Number(process.env.SNAPSHOT_BATCH_SIZE || 500);

const TABLES = [
  {
    hot: 'AccountSnapshotOrderHistory',
    archive: 'AccountSnapshotOrderHistoryArchive',
    cols: `"id","snapshotId","brokerAccountId","ticket","positionId","symbol","openPrice","closePrice","openTime","closeTime","profit","swap","commission","netProfit","holdingSeconds","exitReason","rawJson","capturedAt"`,
  },
  {
    hot: 'AccountSnapshotDeal',
    archive: 'AccountSnapshotDealArchive',
    cols: `"id","snapshotId","brokerAccountId","dealId","positionId","orderId","symbol","price","volume","commission","swap","fee","profit","time","executionType","rawJson","capturedAt"`,
  },
  {
    hot: 'AccountSnapshotSymbol',
    archive: 'AccountSnapshotSymbolArchive',
    cols: `"id","snapshotId","brokerAccountId","symbol","bid","ask","spread","digits","contractSize","tickSize","tickValue","minLot","maxLot","lotStep","tradingEnabled","rawJson","capturedAt"`,
  },
  {
    hot: 'AccountSnapshotMarketData',
    archive: 'AccountSnapshotMarketDataArchive',
    cols: `"id","snapshotId","brokerAccountId","symbol","bid","ask","spread","open","high","low","close","volume","timeframe","tickTimestamp","rawJson","capturedAt"`,
  },
];

const { PrismaClient } = require('@prisma/client');
process.chdir(path.join(ROOT, 'apps/api'));
const prisma = new PrismaClient();

async function q(sql) {
  return prisma.$queryRawUnsafe(sql);
}

fs.mkdirSync(OUT, { recursive: true });

const report = {
  at: new Date().toISOString(),
  dryRun,
  cleanup,
  HOT_KEEP_DAYS,
  ARCHIVE_TTL_DAYS,
  moves: [],
  cleanups: [],
};

try {
  const cutoff = `NOW() - INTERVAL '${HOT_KEEP_DAYS} days'`;

  for (const t of TABLES) {
    const eligible = await q(`
      SELECT COUNT(*)::bigint AS c
      FROM "${t.hot}" h
      WHERE h."capturedAt" < ${cutoff}
        AND NOT EXISTS (
          SELECT 1 FROM "AccountLatestSnapshot" als WHERE als."snapshotId" = h."snapshotId"
        )
    `);
    const count = Number(eligible[0]?.c ?? 0);
    const move = { table: t.hot, archive: t.archive, eligible: count };
    if (count > 0 && !dryRun) {
      const inserted = await q(`
        WITH batch AS (
          SELECT ${t.cols}
          FROM "${t.hot}" h
          WHERE h."capturedAt" < ${cutoff}
            AND NOT EXISTS (
              SELECT 1 FROM "AccountLatestSnapshot" als WHERE als."snapshotId" = h."snapshotId"
            )
          LIMIT ${BATCH}
        ),
        ins AS (
          INSERT INTO "${t.archive}" (${t.cols}, "archivedAt")
          SELECT ${t.cols}, NOW() FROM batch
          ON CONFLICT ("id") DO NOTHING
          RETURNING id
        ),
        del AS (
          DELETE FROM "${t.hot}" h
          USING batch b
          WHERE h.id = b.id
          RETURNING h.id
        )
        SELECT (SELECT COUNT(*) FROM ins)::bigint AS inserted,
               (SELECT COUNT(*) FROM del)::bigint AS deleted
      `);
      move.inserted = Number(inserted[0]?.inserted ?? 0);
      move.deleted = Number(inserted[0]?.deleted ?? 0);
    }
    report.moves.push(move);
  }

  if (cleanup) {
    const archiveCutoff = `NOW() - INTERVAL '${ARCHIVE_TTL_DAYS} days'`;
    for (const t of TABLES) {
      const old = await q(`
        SELECT COUNT(*)::bigint AS c FROM "${t.archive}" WHERE "archivedAt" < ${archiveCutoff}
      `);
      const count = Number(old[0]?.c ?? 0);
      const entry = { table: t.archive, eligible: count };
      if (count > 0 && !dryRun) {
        const del = await q(`
          WITH d AS (
            DELETE FROM "${t.archive}"
            WHERE "archivedAt" < ${archiveCutoff}
            RETURNING id
          )
          SELECT COUNT(*)::bigint AS c FROM d
        `);
        entry.deleted = Number(del[0]?.c ?? 0);
      }
      report.cleanups.push(entry);
    }
  }
} finally {
  await prisma.$disconnect().catch(() => {});
}

fs.writeFileSync(path.join(OUT, 'snapshot-lifecycle.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
