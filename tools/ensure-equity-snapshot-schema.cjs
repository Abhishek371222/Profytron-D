const path = require('path');
const { createRequire } = require('module');
const root = path.join(__dirname, '..');
const apiDir = path.join(root, 'apps', 'api');
const apiRequire = createRequire(path.join(apiDir, 'package.json'));
const { PrismaClient } = apiRequire('@prisma/client');

async function main() {
  const p = new PrismaClient();
  try {
    await p.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "EquitySnapshot" (
        "id" TEXT NOT NULL,
        "brokerAccountId" TEXT NOT NULL,
        "balance" DOUBLE PRECISION NOT NULL,
        "equity" DOUBLE PRECISION NOT NULL,
        "margin" DOUBLE PRECISION,
        "freeMargin" DOUBLE PRECISION,
        "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "EquitySnapshot_pkey" PRIMARY KEY ("id")
      )
    `);

    await p.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS "EquitySnapshot_brokerAccountId_capturedAt_idx" ON "EquitySnapshot"("brokerAccountId", "capturedAt")',
    );

    const fkExists = await p.$queryRawUnsafe(`
      SELECT 1 FROM pg_constraint WHERE conname = 'EquitySnapshot_brokerAccountId_fkey'
    `);
    if (!Array.isArray(fkExists) || fkExists.length === 0) {
      await p.$executeRawUnsafe(`
        ALTER TABLE "EquitySnapshot"
        ADD CONSTRAINT "EquitySnapshot_brokerAccountId_fkey"
        FOREIGN KEY ("brokerAccountId") REFERENCES "BrokerAccount"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
      `);
    }

    const dupes = await p.$queryRawUnsafe(`
      SELECT "brokerAccountId", "brokerTicket", COUNT(*) c
      FROM "Trade"
      WHERE "brokerAccountId" IS NOT NULL AND "brokerTicket" IS NOT NULL
      GROUP BY "brokerAccountId", "brokerTicket"
      HAVING COUNT(*) > 1
    `);

    if (Array.isArray(dupes) && dupes.length > 0) {
      console.warn(
        `Skipping Trade unique constraint — ${dupes.length} duplicate (brokerAccountId, brokerTicket) group(s) found. Resolve manually then re-run.`,
      );
    } else {
      const uniqueExists = await p.$queryRawUnsafe(`
        SELECT 1 FROM pg_constraint WHERE conname = 'trade_broker_account_ticket_unique'
      `);
      if (!Array.isArray(uniqueExists) || uniqueExists.length === 0) {
        await p.$executeRawUnsafe(`
          ALTER TABLE "Trade"
          ADD CONSTRAINT "trade_broker_account_ticket_unique"
          UNIQUE ("brokerAccountId", "brokerTicket")
        `);
      }
    }

    console.log('equity snapshot schema ok');
  } finally {
    await p.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
