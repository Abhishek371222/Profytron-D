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
const DEMO_NAME = 'Profytron Demo Bot';

async function main() {
  const existing = await prisma.strategy.findFirst({
    where: { name: DEMO_NAME, deletedAt: null },
    include: { listing: true },
  });
  if (existing) {
    console.log('Demo bot already exists:', existing.id);
    if (!existing.isPublished || !existing.isVerified || !existing.listing) {
      await prisma.strategy.update({
        where: { id: existing.id },
        data: {
          isPublished: true,
          isVerified: true,
          verificationStatus: 'VERIFIED',
          monthlyPrice: 0,
          annualPrice: 0,
          lifetimePrice: 0,
          isFeatured: true,
        },
      });
      if (!existing.listing) {
        await prisma.marketplaceListing.create({
          data: {
            strategyId: existing.id,
            monthlyPrice: 0,
            annualPrice: 0,
            lifetimePrice: 0,
            trialDays: 7,
            isFeatured: true,
          },
        });
      } else {
        await prisma.marketplaceListing.update({
          where: { strategyId: existing.id },
          data: {
            monthlyPrice: 0,
            annualPrice: 0,
            lifetimePrice: 0,
            isFeatured: true,
          },
        });
      }
      console.log('Republished existing demo bot.');
    }
    await printStatus(existing.id);
    return;
  }

  const creator =
    (await prisma.user.findFirst({
      where: { email: { in: ['admin@profytron.com', 'demo@profytron.com'] } },
      orderBy: { email: 'asc' },
    })) ||
    (await prisma.user.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    }));

  if (!creator) {
    throw new Error('No user found to own the demo bot');
  }

  const strategy = await prisma.strategy.create({
    data: {
      creatorId: creator.id,
      name: DEMO_NAME,
      description:
        'Free demo bot for end-to-end flow testing. Subscribe with a live MT5 account to verify marketplace → My Bots → dashboard. Synthetic performance only — not real trading signals.',
      category: 'TREND',
      riskLevel: 'LOW',
      assetClass: 'Forex',
      timeframe: 'H1',
      configJson: {
        demo: true,
        logic: 'EMA_CROSS',
        note: 'UI flow demo — no master copy required',
      },
      isPublished: true,
      isVerified: true,
      verificationStatus: 'VERIFIED',
      monthlyPrice: 0,
      annualPrice: 0,
      lifetimePrice: 0,
      maxCopies: 500,
      copiesCount: 42,
      isFeatured: true,
    },
  });

  await prisma.marketplaceListing.create({
    data: {
      strategyId: strategy.id,
      monthlyPrice: 0,
      annualPrice: 0,
      lifetimePrice: 0,
      trialDays: 7,
      maxCopies: 500,
      isFeatured: true,
      creatorSharePct: 0.8,
      platformSharePct: 0.2,
      payoutEnabled: false,
    },
  });

  // Lightweight performance so marketplace cards look live
  const BASE = 10_000;
  const days = 90;
  const now = new Date();
  const rows = [];
  let cumPnl = 0;
  let cumTrades = 0;
  let cumWins = 0;
  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const dayPnl = 8 + Math.sin(i / 7) * 12;
    cumPnl += dayPnl;
    const trades = 2 + (i % 4);
    const wins = Math.round(trades * 0.62);
    cumTrades += trades;
    cumWins += wins;
    rows.push({
      strategyId: strategy.id,
      date: d,
      winRate: Number(((cumWins / Math.max(1, cumTrades)) * 100).toFixed(1)),
      drawdown: Number(Math.max(0, -Math.min(0, dayPnl) / BASE * 100).toFixed(2)),
      maxDrawdown: 6.5,
      sharpeRatio: 1.6,
      sortinoRatio: 1.9,
      totalTrades: trades,
      winningTrades: wins,
      netPnl: Number(cumPnl.toFixed(2)),
      equityCurve: [{ time: d.getTime(), value: Number((BASE + cumPnl).toFixed(2)) }],
    });
  }
  await prisma.strategyPerformance.createMany({ data: rows });

  console.log('Created demo bot:', strategy.id);
  console.log('Creator:', creator.email);
  await printStatus(strategy.id);
}

async function printStatus(strategyId) {
  const s = await prisma.strategy.findUnique({
    where: { id: strategyId },
    include: {
      listing: true,
      creator: { select: { email: true } },
      _count: { select: { performance: true, subscriptions: true } },
    },
  });
  console.log(
    JSON.stringify(
      {
        id: s.id,
        name: s.name,
        published: s.isPublished,
        verified: s.isVerified,
        monthlyPrice: s.listing?.monthlyPrice,
        featured: s.listing?.isFeatured,
        performanceDays: s._count.performance,
        subscriptions: s._count.subscriptions,
        creator: s.creator.email,
      },
      null,
      2,
    ),
  );

  const liveBrokers = await prisma.brokerAccount.findMany({
    where: { isActive: true, isPaperTrading: false },
    select: {
      id: true,
      accountNumberLast4: true,
      user: { select: { email: true } },
    },
  });
  console.log('Active live MT5 accounts (needed to subscribe):');
  console.log(JSON.stringify(liveBrokers, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
