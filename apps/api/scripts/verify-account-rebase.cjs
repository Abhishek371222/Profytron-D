const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

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
  const rows = await prisma.$queryRawUnsafe(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name ILIKE '%Snapshot%'
    ORDER BY table_name
  `);
  console.log(rows);

  const broker = await prisma.brokerAccount.findFirst({
    where: {
      userId: (
        await prisma.user.findUnique({
          where: { email: 'abhiaj371@gmail.com' },
          select: { id: true },
        })
      )?.id,
      isActive: true,
      isPaperTrading: false,
    },
    select: {
      id: true,
      initialEquity: true,
      lastKnownEquity: true,
      lastKnownBalance: true,
      isDefault: true,
      accountNumberLast4: true,
    },
  });
  console.log('broker', broker);

  const tradeCount = await prisma.trade.count({
    where: { brokerAccountId: broker.id },
  });
  const closed = await prisma.trade.aggregate({
    where: { brokerAccountId: broker.id, status: 'CLOSED' },
    _count: true,
    _sum: { profit: true },
  });
  console.log({ tradeCount, closed });

  const sub = await prisma.userStrategySubscription.findFirst({
    where: {
      userId: (
        await prisma.user.findUnique({
          where: { email: 'abhiaj371@gmail.com' },
          select: { id: true },
        })
      ).id,
      strategy: { name: 'Profytron Demo Bot' },
    },
    select: {
      status: true,
      equityBaselineAtSubscribe: true,
      strategyId: true,
    },
  });
  console.log('sub', sub);

  const perf = await prisma.strategyPerformance.count({
    where: { strategyId: sub?.strategyId },
  });
  console.log('perfDays', perf);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
