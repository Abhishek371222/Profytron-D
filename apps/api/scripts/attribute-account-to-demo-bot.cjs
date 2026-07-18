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

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('User not found');

  const strategy = await prisma.strategy.findFirst({
    where: { name: botName, deletedAt: null },
  });
  if (!strategy) throw new Error('Bot not found');

  const broker = await prisma.brokerAccount.findFirst({
    where: {
      userId: user.id,
      isActive: true,
      isPaperTrading: false,
    },
    orderBy: [{ isDefault: 'desc' }, { connectedAt: 'desc' }],
  });
  if (!broker) throw new Error('No active live broker');

  const earliest = await prisma.trade.findFirst({
    where: { userId: user.id, brokerAccountId: broker.id },
    orderBy: { openedAt: 'asc' },
    select: { openedAt: true },
  });
  const subscribedAt =
    earliest?.openedAt ||
    broker.connectedAt ||
    new Date(Date.now() - 7 * 24 * 3600 * 1000);

  const existing = await prisma.userStrategySubscription.findUnique({
    where: {
      userId_strategyId: { userId: user.id, strategyId: strategy.id },
    },
  });

  let sub;
  if (existing) {
    sub = await prisma.userStrategySubscription.update({
      where: { id: existing.id },
      data: {
        status: 'ACTIVE',
        brokerAccountId: broker.id,
        subscribedAt,
        cancelledAt: null,
        expiresAt: null,
      },
    });
  } else {
    sub = await prisma.userStrategySubscription.create({
      data: {
        userId: user.id,
        strategyId: strategy.id,
        brokerAccountId: broker.id,
        status: 'ACTIVE',
        planType: 'lifetime',
        subscribedAt,
      },
    });
  }

  // Pause/deactivate other bots on this same broker so Demo Bot owns the account
  const others = await prisma.userStrategySubscription.updateMany({
    where: {
      userId: user.id,
      brokerAccountId: broker.id,
      id: { not: sub.id },
      status: { in: ['ACTIVE', 'PROVISIONING', 'PAUSED'] },
    },
    data: { status: 'INACTIVE', cancelledAt: new Date() },
  });

  const attributed = await prisma.trade.updateMany({
    where: {
      userId: user.id,
      brokerAccountId: broker.id,
      OR: [{ strategyId: null }, { strategyId: { not: strategy.id } }],
    },
    data: { strategyId: strategy.id },
  });

  // Also attribute any user trades without brokerAccountId (legacy) on this user
  const orphan = await prisma.trade.updateMany({
    where: {
      userId: user.id,
      brokerAccountId: null,
      OR: [{ strategyId: null }, { strategyId: { not: strategy.id } }],
    },
    data: {
      strategyId: strategy.id,
      brokerAccountId: broker.id,
    },
  });

  const stats = await prisma.trade.aggregate({
    where: {
      userId: user.id,
      brokerAccountId: broker.id,
      strategyId: strategy.id,
      status: 'CLOSED',
    },
    _count: true,
    _sum: { profit: true },
  });

  const openCount = await prisma.trade.count({
    where: {
      userId: user.id,
      brokerAccountId: broker.id,
      strategyId: strategy.id,
      status: 'OPEN',
    },
  });

  await prisma.strategy.update({
    where: { id: strategy.id },
    data: {
      copiesCount: { increment: existing ? 0 : 1 },
    },
  });

  console.log(
    JSON.stringify(
      {
        email,
        bot: strategy.name,
        strategyId: strategy.id,
        brokerAccountId: broker.id,
        last4: broker.accountNumberLast4,
        subscriptionId: sub.id,
        subscriptionStatus: sub.status,
        subscribedAt,
        otherBotsDeactivated: others.count,
        tradesReattributed: attributed.count,
        orphanTradesLinked: orphan.count,
        closedTrades: stats._count,
        openTrades: openCount,
        botNetPnl: Number((stats._sum.profit ?? 0).toFixed(2)),
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
