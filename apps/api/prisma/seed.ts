import { PrismaClient, UserRole, KycStatus, SubscriptionTier, RiskLevel, StrategyCategory, VerificationStatus, TradeDirection, TradeStatus, SubscriptionStatus, TransactionType, TransactionDirection, TransactionStatus, AffiliateTier, AchievementTier, NotificationType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing old data...');
  // Wipe everything in order of foreign key safety
  await prisma.aITradeExplanation.deleteMany();
  await prisma.strategyReview.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.userAchievement.deleteMany();
  await prisma.affiliate.deleteMany();
  await prisma.marketplaceListing.deleteMany();
  await prisma.walletTransaction.deleteMany();
  await prisma.trade.deleteMany();
  await prisma.userStrategySubscription.deleteMany();
  await prisma.strategyPerformance.deleteMany();
  await prisma.brokerAccount.deleteMany();
  await prisma.strategy.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding Users...');
  const passwordHash = await bcrypt.hash('Demo@123', 12);
  const password = await bcrypt.hash('Demo@123', 12);

  // Demo user (regular)
  const u1 = await prisma.user.upsert({
    where: { email: 'demo@profytron.com' },
    update: {
      emailVerified: true,
      isActive: true,
      isSuspended: false,
      role: UserRole.USER,
    },
    create: {
      email: 'demo@profytron.com',
      passwordHash: password,
      fullName: 'Demo Trader',
      username: 'demo_trader',
      emailVerified: true,
      isActive: true,
      isSuspended: false,
      referralCode: randomUUID(),
      role: UserRole.USER,
      subscriptionTier: SubscriptionTier.PRO,
      kycStatus: KycStatus.VERIFIED,
      riskDnaScore: 7.4
    },
  });

  // Admin user
  const u4 = await prisma.user.upsert({
    where: { email: 'admin@profytron.com' },
    update: {
      emailVerified: true,
      isActive: true,
      isSuspended: false,
      role: UserRole.ADMIN,
    },
    create: {
      email: 'admin@profytron.com',
      passwordHash: password,
      fullName: 'Admin',
      username: 'admin',
      emailVerified: true,
      isActive: true,
      isSuspended: false,
      referralCode: randomUUID(),
      role: UserRole.ADMIN,
      subscriptionTier: SubscriptionTier.ELITE,
      kycStatus: KycStatus.VERIFIED
    },
  });

  const u2 = await prisma.user.create({
    data: { email: 'pro@profytron.com', passwordHash: password, fullName: 'Priya Patel', subscriptionTier: SubscriptionTier.ELITE, kycStatus: KycStatus.VERIFIED, riskDnaScore: 8.2 }
  });
  const u3 = await prisma.user.create({
    data: { email: 'creator@profytron.com', passwordHash: password, fullName: 'Rahul Singh', subscriptionTier: SubscriptionTier.PRO, kycStatus: KycStatus.VERIFIED, riskDnaScore: 6.1, role: UserRole.CREATOR }
  });
  const u5 = await prisma.user.create({
    data: { email: 'free@profytron.com', passwordHash: password, fullName: 'Ananya Gupta', subscriptionTier: SubscriptionTier.FREE, kycStatus: KycStatus.NOT_STARTED, riskDnaScore: 3.5 }
  });

  console.log('Seeding Strategies...');
  const strats = [
    { name: 'MomentumPro', cat: StrategyCategory.TREND, rl: RiskLevel.MEDIUM, vs: VerificationStatus.VERIFIED, price: 2499 },
    { name: 'ScalpMaster', cat: StrategyCategory.SCALPING, rl: RiskLevel.HIGH, vs: VerificationStatus.VERIFIED, price: 3999 },
    { name: 'RangeRadar', cat: StrategyCategory.RANGE, rl: RiskLevel.LOW, vs: VerificationStatus.VERIFIED, price: 1499 },
    { name: 'VolBreaker', cat: StrategyCategory.VOLATILITY, rl: RiskLevel.EXPERT, vs: VerificationStatus.VERIFIED, price: 5999 },
    { name: 'TrendRider', cat: StrategyCategory.TREND, rl: RiskLevel.LOW, vs: VerificationStatus.VERIFIED, price: 0 },
    { name: 'GoldSurfer', cat: StrategyCategory.VOLATILITY, rl: RiskLevel.HIGH, vs: VerificationStatus.UNVERIFIED, price: 4499 },
    { name: 'SwingKing', cat: StrategyCategory.RANGE, rl: RiskLevel.MEDIUM, vs: VerificationStatus.VERIFIED, price: 1999 },
    { name: 'NewsTrader', cat: StrategyCategory.SCALPING, rl: RiskLevel.EXPERT, vs: VerificationStatus.UNVERIFIED, price: 7999 }
  ];

  const strategyIds: string[] = [];
  for (const s of strats) {
    const isFree = s.price === 0;
    const isPublished = true;
    const st = await prisma.strategy.create({
      data: {
        creatorId: u3.id,
        name: s.name,
        description: `High performance ${s.cat} strategy using institutional data flows and advanced technical indicators. Optimized for ${s.rl.toLowerCase()} risk profiles.`,
        category: s.cat,
        riskLevel: s.rl,
        verificationStatus: s.vs,
        isVerified: s.vs === VerificationStatus.VERIFIED,
        isPublished,
        monthlyPrice: isFree ? 0 : s.price,
        configJson: { param: 'test', logic: 'EMA_CROSS' },
        copiesCount: Math.floor(Math.random() * 400),
      }
    });
    strategyIds.push(st.id);

    // Create Marketplace Listing
    await prisma.marketplaceListing.create({
      data: {
        strategyId: st.id,
        monthlyPrice: isFree ? 0 : s.price,
        annualPrice: isFree ? 0 : s.price * 10,
        lifetimePrice: isFree ? 0 : s.price * 30,
        isFeatured: s.cat === StrategyCategory.TREND,
        trialDays: 7,
      }
    });


    // Seed 365 Days Performance with Brownian Motion
    let cumPnl = 0;
    const now = new Date();
    const perfRecords = [];
    for (let i = 365; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const isWin = Math.random() > 0.4;
      const dailyPnl = isWin ? Math.random() * 50 : -(Math.random() * 30);
      cumPnl += dailyPnl;

      perfRecords.push({
        strategyId: st.id,
        date: d,
        winRate: (60 + Math.random() * 15),
        drawdown: Math.random() * 10,
        maxDrawdown: 15.5,
        sharpeRatio: (1.5 + Math.random()),
        totalTrades: i === 365 ? 0 : 5,
        winningTrades: i === 365 ? 0 : 3,
        netPnl: cumPnl,
        equityCurve: JSON.stringify([{ time: d.getTime(), value: cumPnl }])
      });
    }
    await prisma.strategyPerformance.createMany({ data: perfRecords });
  }

  console.log('Seeding Broker Accounts...');
  const brokerAccount = await prisma.brokerAccount.create({
    data: {
      userId: u1.id,
      brokerName: 'PAPER',
      accountNumberLast4: '9942',
      credentialsEncrypted: 'mock-enc-creds',
      isPaperTrading: true,
      isDefault: true,
    }
  });

  console.log('Seeding Subscriptions...');
  const subs = [strategyIds[0], strategyIds[1], strategyIds[2], strategyIds[4], strategyIds[6]];
  for (const sId of subs) {
    await prisma.userStrategySubscription.create({
      data: {
        userId: u1.id,
        strategyId: sId,
        brokerAccountId: brokerAccount.id,
        status: SubscriptionStatus.ACTIVE,
      }
    });
  }

  console.log('Seeding Trades for Demo User...');
  const currencies = ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'US30'];
  for (let i = 0; i < 200; i++) {
    const symbol = currencies[Math.floor(Math.random() * currencies.length)];
    const isWin = Math.random() > 0.35; // 65% win rate
    const profit = isWin ? 1200 + Math.random() * 200 : -680 - Math.random() * 100;
    const isOpen = i < 5;
    const status = isOpen ? TradeStatus.OPEN : TradeStatus.CLOSED;

    await prisma.trade.create({
      data: {
        userId: u1.id,
        strategyId: subs[Math.floor(Math.random() * subs.length)],
        brokerAccountId: brokerAccount.id,
        symbol,
        direction: Math.random() > 0.5 ? TradeDirection.LONG : TradeDirection.SHORT,
        volume: 1.0,
        openPrice: 1.0,
        closePrice: isOpen ? null : 1.1,
        profit: isOpen ? null : profit,
        status,
        openedAt: new Date(Date.now() - (i * 3600000)),
        closedAt: isOpen ? null : new Date(Date.now() - (i * 3600000 - 1800000)),
      }
    });
  }

  console.log('Seeding Wallet Transactions...');
  let currentBalance = 124580;
  for (let i = 0; i < 30; i++) {
    let type: TransactionType = TransactionType.DEPOSIT;
    let direction: TransactionDirection = TransactionDirection.IN;
    let amount = 1000;
    let status: TransactionStatus = i < 2 ? TransactionStatus.PENDING : TransactionStatus.CONFIRMED;
    const r = Math.random();
    if (r > 0.8) { type = TransactionType.DEPOSIT; direction = TransactionDirection.IN; amount = 5000; }
    else if (r > 0.5) { type = TransactionType.SUBSCRIPTION_PAYMENT; direction = TransactionDirection.OUT; amount = 2499; }
    else if (r > 0.2) { type = TransactionType.COMMISSION; direction = TransactionDirection.IN; amount = 300; }
    else { type = TransactionType.MARKETPLACE_SALE; direction = TransactionDirection.IN; amount = 1500; }

    currentBalance = direction === TransactionDirection.IN ? currentBalance - amount : currentBalance + amount;

    await prisma.walletTransaction.create({
      data: {
        userId: u1.id,
        type,
        direction,
        amount,
        balanceAfter: currentBalance, // simplified backwards balance calculation
        status,
        idempotencyKey: `tx-${i}-${Date.now()}`,
      }
    });
  }

  console.log('Seeding Achievements & Notifications...');
  for (let i = 0; i < 8; i++) {
    await prisma.userAchievement.create({
      data: {
        userId: u1.id,
        achievementKey: `ACHV_${i}`,
        tier: i % 2 === 0 ? AchievementTier.SILVER : AchievementTier.BRONZE
      }
    });
  }

  for (let i = 0; i < 5; i++) {
    await prisma.notification.create({
      data: {
        userId: u1.id,
        type: NotificationType.INFO,
        title: `System Alert ${i}`,
        body: 'Your strategy has executed a new trade successfully.',
        isRead: false
      }
    });
  }

  console.log('Seeding complete ✅');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
