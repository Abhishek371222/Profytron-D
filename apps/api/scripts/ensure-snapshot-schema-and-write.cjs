const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const envPath = path.join(__dirname, '..', '.env');
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  const key = m[1].trim();
  let val = m[2].trim();
  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    val = val.slice(1, -1);
  }
  if (!process.env[key]) process.env[key] = val;
}

const prisma = new PrismaClient();

async function main() {
  const cols = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'AccountSnapshot'
    ORDER BY ordinal_position
  `);
  console.log('columns', cols.map((c) => c.column_name).join(', '));

  // Ensure expanded columns exist (best-effort, ignore duplicates)
  const alters = [
    `ALTER TABLE "AccountSnapshot" ADD COLUMN IF NOT EXISTS "pendingOrdersJson" JSONB`,
    `ALTER TABLE "AccountSnapshot" ADD COLUMN IF NOT EXISTS "dealsJson" JSONB`,
    `ALTER TABLE "AccountSnapshot" ADD COLUMN IF NOT EXISTS "orderHistoryJson" JSONB`,
    `ALTER TABLE "AccountSnapshot" ADD COLUMN IF NOT EXISTS "symbolsJson" JSONB`,
    `ALTER TABLE "AccountSnapshot" ADD COLUMN IF NOT EXISTS "marketDataJson" JSONB`,
    `ALTER TABLE "AccountSnapshot" ADD COLUMN IF NOT EXISTS "accountStatusJson" JSONB`,
    `ALTER TABLE "AccountSnapshot" ADD COLUMN IF NOT EXISTS "copyTradingJson" JSONB`,
    `ALTER TABLE "AccountSnapshot" ADD COLUMN IF NOT EXISTS "performanceJson" JSONB`,
    `ALTER TABLE "AccountSnapshot" ADD COLUMN IF NOT EXISTS "riskJson" JSONB`,
    `ALTER TABLE "AccountSnapshot" ADD COLUMN IF NOT EXISTS "eventsJson" JSONB`,
    `ALTER TABLE "AccountSnapshot" ADD COLUMN IF NOT EXISTS "realizedProfit" DOUBLE PRECISION NOT NULL DEFAULT 0`,
    `ALTER TABLE "AccountSnapshot" ADD COLUMN IF NOT EXISTS "unrealizedProfit" DOUBLE PRECISION NOT NULL DEFAULT 0`,
    `ALTER TABLE "AccountSnapshot" ADD COLUMN IF NOT EXISTS "todayProfit" DOUBLE PRECISION NOT NULL DEFAULT 0`,
    `ALTER TABLE "AccountSnapshot" ADD COLUMN IF NOT EXISTS "todayLoss" DOUBLE PRECISION NOT NULL DEFAULT 0`,
    `ALTER TABLE "AccountSnapshot" ADD COLUMN IF NOT EXISTS "weeklyProfit" DOUBLE PRECISION NOT NULL DEFAULT 0`,
    `ALTER TABLE "AccountSnapshot" ADD COLUMN IF NOT EXISTS "monthlyProfit" DOUBLE PRECISION NOT NULL DEFAULT 0`,
    `ALTER TABLE "AccountSnapshot" ADD COLUMN IF NOT EXISTS "netProfit" DOUBLE PRECISION NOT NULL DEFAULT 0`,
    `ALTER TABLE "AccountSnapshot" ADD COLUMN IF NOT EXISTS "lastSuccessfulSync" TIMESTAMP(3)`,
    `CREATE TABLE IF NOT EXISTS "AccountLatestSnapshot" (
      "brokerAccountId" TEXT NOT NULL,
      "snapshotId" TEXT NOT NULL,
      "lastSyncedAt" TIMESTAMP(3) NOT NULL,
      "lastSuccessfulSync" TIMESTAMP(3) NOT NULL,
      "syncDurationMs" INTEGER,
      "syncStatus" TEXT NOT NULL DEFAULT 'SUCCESS',
      "metaApiLatencyMs" INTEGER,
      "apiVersion" TEXT,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "AccountLatestSnapshot_pkey" PRIMARY KEY ("brokerAccountId")
    )`,
  ];

  for (const sql of alters) {
    try {
      await prisma.$executeRawUnsafe(sql);
    } catch (e) {
      console.warn('alter skip:', e.message.slice(0, 100));
    }
  }

  // FK / unique best-effort
  try {
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "AccountLatestSnapshot_snapshotId_key"
      ON "AccountLatestSnapshot"("snapshotId")
    `);
  } catch {}

  const brokerId = 'cc30aef2-4c6e-4f85-8e81-c14fa9de227c';
  const id = randomUUID();
  await prisma.$executeRawUnsafe(
    `
    INSERT INTO "AccountSnapshot" (
      "id", "brokerAccountId", "login", "server", "platform", "currency", "leverage",
      "connectionStatus", "synchronizationStatus",
      "balance", "equity", "credit", "margin", "freeMargin", "marginLevel", "floatingPnl",
      "positionsJson", "positionsCount",
      "performanceJson", "riskJson",
      "realizedProfit", "unrealizedProfit", "netProfit",
      "syncStatus", "apiVersion", "lastSuccessfulSync", "capturedAt"
    ) VALUES (
      $1, $2, '961334', 'BitrageCapitalMarkets-Server', 'mt5', 'USD', 500,
      'CONNECTED', 'SYNCHRONIZED',
      148.53, 148.53, 0, 0, 148.53, 0, 0,
      '[]'::jsonb, 0,
      $3::jsonb, $4::jsonb,
      48.53, 0, 48.53,
      'SUCCESS', 'METAAPI_FULL_SYNC', NOW(), NOW()
    )
    `,
    id,
    brokerId,
    JSON.stringify({
      initialDeposit: 100,
      returnPct: 48.53,
      tradingPnl: 48.53,
    }),
    JSON.stringify({
      margin: 0,
      freeMargin: 148.53,
      marginLevel: 0,
      openPositions: 0,
    }),
  );

  await prisma.$executeRawUnsafe(
    `
    INSERT INTO "AccountLatestSnapshot" (
      "brokerAccountId", "snapshotId", "lastSyncedAt", "lastSuccessfulSync", "syncStatus", "updatedAt"
    ) VALUES ($1, $2, NOW(), NOW(), 'SUCCESS', NOW())
    ON CONFLICT ("brokerAccountId") DO UPDATE SET
      "snapshotId" = EXCLUDED."snapshotId",
      "lastSyncedAt" = NOW(),
      "lastSuccessfulSync" = NOW(),
      "syncStatus" = 'SUCCESS',
      "updatedAt" = NOW()
    `,
    brokerId,
    id,
  );

  console.log('snapshot written', id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
