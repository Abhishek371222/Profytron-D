const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const envPath = path.join(__dirname, '..', '.env');
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  if (process.env[m[1]] === undefined) process.env[m[1]] = v;
}

const STRATEGY_ID = 'ec900113-133f-4eba-9063-1d7ef18831f5';

(async () => {
  const prisma = new PrismaClient();
  try {
    const existing = await prisma.marketplaceListing.findUnique({
      where: { strategyId: STRATEGY_ID },
    });
    if (!existing) {
      const listing = await prisma.marketplaceListing.create({
        data: {
          strategyId: STRATEGY_ID,
          monthlyPrice: 49,
          annualPrice: 399,
          lifetimePrice: 0,
          trialDays: 0,
          isFeatured: true,
          maxCopies: 500,
          creatorSharePct: 0.8,
          platformSharePct: 0.2,
          payoutEnabled: true,
        },
      });
      console.log('Created listing', listing.id);
    } else {
      console.log('Listing exists', existing.id);
    }

    const strategy = await prisma.strategy.findUnique({
      where: { id: STRATEGY_ID },
      select: {
        id: true,
        name: true,
        masterBrokerAccountId: true,
        isPublished: true,
        copyFactoryStrategyId: true,
      },
    });
    const broker = await prisma.brokerAccount.findUnique({
      where: { id: strategy.masterBrokerAccountId },
      select: {
        id: true,
        isMasterSource: true,
        isActive: true,
        accountNumberLast4: true,
        serverName: true,
      },
    });
    console.log(
      JSON.stringify(
        {
          ok: true,
          strategy,
          broker,
          note: 'Master + strategy + listing ready. No subscribers created.',
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
