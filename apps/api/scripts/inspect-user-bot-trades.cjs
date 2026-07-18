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
  const email = process.argv[2] || 'abhiaj371@gmail.com';
  const botName = process.argv[3] || 'Profytron Demo Bot';

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });
  if (!user) throw new Error('User not found: ' + email);

  const strategy = await prisma.strategy.findFirst({
    where: { name: botName, deletedAt: null },
    select: { id: true, name: true },
  });
  if (!strategy) throw new Error('Bot not found: ' + botName);

  const broker = await prisma.brokerAccount.findFirst({
    where: {
      userId: user.id,
      isActive: true,
      isPaperTrading: false,
      accountNumberLast4: '1334',
    },
    select: { id: true, accountNumberLast4: true, serverName: true },
  });
  if (!broker) {
    const any = await prisma.brokerAccount.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        isActive: true,
        isPaperTrading: true,
        accountNumberLast4: true,
      },
    });
    console.log('No active live broker. All brokers:', any);
    throw new Error('No active live MT5 for user');
  }

  console.log({ user, strategy, broker });

  const tradeCount = await prisma.trade.count({
    where: { userId: user.id, brokerAccountId: broker.id },
  });
  const unattributed = await prisma.trade.count({
    where: {
      userId: user.id,
      brokerAccountId: broker.id,
      OR: [{ strategyId: null }, { strategyId: { not: strategy.id } }],
    },
  });
  console.log({ tradeCount, unattributed });

  const subs = await prisma.userStrategySubscription.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      strategyId: true,
      status: true,
      brokerAccountId: true,
      strategy: { select: { name: true } },
    },
  });
  console.log('subs', JSON.stringify(subs, null, 2));

  // snapshot deals if any
  const latest = await prisma.accountLatestSnapshot.findUnique({
    where: { brokerAccountId: broker.id },
  }).catch(() => null);

  let dealCount = 0;
  if (latest?.snapshotId) {
    dealCount = await prisma.accountSnapshotDeal.count({
      where: { snapshotId: latest.snapshotId },
    }).catch(() => 0);
  }
  console.log({ latestSnapshotId: latest?.snapshotId, dealCount });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
