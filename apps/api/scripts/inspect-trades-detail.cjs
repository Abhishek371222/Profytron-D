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
  const userId = '11f75bad-3e8c-46a1-9761-5cbbbab569dc';
  const brokerId = 'cc30aef2-4c6e-4f85-8e81-c14fa9de227c';
  const strategyId = 'f8d31eb9-15e6-4c1f-897b-e7f4f19938c5';

  const byStrategy = await prisma.trade.groupBy({
    by: ['strategyId', 'status'],
    where: { userId, brokerAccountId: brokerId },
    _count: true,
  });
  console.log('byStrategy', byStrategy);

  const sample = await prisma.trade.findMany({
    where: { userId, brokerAccountId: brokerId },
    take: 5,
    orderBy: { openedAt: 'desc' },
    select: {
      id: true,
      symbol: true,
      strategyId: true,
      status: true,
      profit: true,
      openedAt: true,
      strategy: { select: { name: true } },
    },
  });
  console.log('sample', JSON.stringify(sample, null, 2));

  const latest = await prisma.accountLatestSnapshot.findUnique({
    where: { brokerAccountId: brokerId },
  });
  console.log('latest', latest);

  if (latest) {
    const deals = await prisma.accountSnapshotDeal.findMany({
      where: { brokerAccountId: brokerId },
      take: 10,
      orderBy: { time: 'desc' },
      select: { dealId: true, symbol: true, profit: true, time: true },
    });
    console.log('recent deals', deals.length, deals.slice(0, 3));
  }

  // any other active bots on this account?
  const otherSubs = await prisma.userStrategySubscription.findMany({
    where: {
      userId,
      brokerAccountId: brokerId,
      status: { in: ['ACTIVE', 'PROVISIONING', 'PAUSED'] },
    },
    include: { strategy: { select: { name: true } } },
  });
  console.log('active subs', otherSubs.map((s) => ({ id: s.id, name: s.strategy.name, status: s.status })));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
