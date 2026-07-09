import { PrismaClient, UserRole, KycStatus, SubscriptionTier, RiskLevel, StrategyCategory, VerificationStatus, TradeDirection, TradeStatus, SubscriptionStatus, TransactionType, TransactionDirection, TransactionStatus, AffiliateTier, AchievementTier, NotificationType, PaymentStatus, PaymentMethod } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { PLATFORM_PLANS } from '../src/common/constants/pricing.constants';

// Single source of truth for pricing lives in pricing.constants.ts — seed
// from it directly so this table can never drift out of sync again.
const PLATFORM_PLANS_SEED = PLATFORM_PLANS.filter((p) => p.monthlyPrice >= 0);

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
  await prisma.userSubscription.deleteMany();
  await prisma.subscriptionPlan.deleteMany();
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
      onboardingCompleted: true,
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
      onboardingCompleted: true,
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
      onboardingCompleted: true,
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
      kycStatus: KycStatus.VERIFIED,
      onboardingCompleted: true,
    },
  });

  const u2 = await prisma.user.create({
    data: { email: 'pro@profytron.com', passwordHash: password, fullName: 'Priya Patel', subscriptionTier: SubscriptionTier.ELITE, kycStatus: KycStatus.VERIFIED, riskDnaScore: 8.2, emailVerified: true, isActive: true, onboardingCompleted: true }
  });
  const u3 = await prisma.user.create({
    data: { email: 'creator@profytron.com', passwordHash: password, fullName: 'Rahul Singh', subscriptionTier: SubscriptionTier.PRO, kycStatus: KycStatus.VERIFIED, riskDnaScore: 6.1, role: UserRole.CREATOR, emailVerified: true, isActive: true, onboardingCompleted: true }
  });
  const u5 = await prisma.user.create({
    data: { email: 'free@profytron.com', passwordHash: password, fullName: 'Ananya Gupta', subscriptionTier: SubscriptionTier.FREE, kycStatus: KycStatus.NOT_STARTED, riskDnaScore: 3.5, emailVerified: true, isActive: true, onboardingCompleted: true }
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

  // Deterministic, plausible subscriber counts (free + verified strategies are more popular).
  const COPIES_BY_INDEX = [1284, 947, 612, 438, 2156, 321, 789, 198];

  // Risk-tiered performance profiles so win-rate / Sharpe / drawdown / net P&L all
  // tell a consistent story per strategy (higher risk → higher return + drawdown).
  const RISK_PROFILES: Record<string, { win: number; annualPct: number; sharpe: number; maxDd: number }> = {
    LOW: { win: 64, annualPct: 14, sharpe: 1.7, maxDd: 6 },
    MEDIUM: { win: 61, annualPct: 26, sharpe: 1.9, maxDd: 11 },
    HIGH: { win: 57, annualPct: 42, sharpe: 1.4, maxDd: 19 },
    EXPERT: { win: 54, annualPct: 58, sharpe: 1.2, maxDd: 27 },
  };
  const BASE_EQUITY = 10_000;

  const strategyIds: string[] = [];
  for (let idx = 0; idx < strats.length; idx++) {
    const s = strats[idx];
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
        copiesCount: COPIES_BY_INDEX[idx] ?? 200,
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

    // Seed 365 days of coherent performance: equity grows smoothly toward the
    // profile's annual return, with mild dips that define the drawdown. The final
    // record's netPnl equals annualPct% of BASE_EQUITY, so My Bots / Marketplace
    // show a believable, internally-consistent return.
    const profile = RISK_PROFILES[s.rl] ?? RISK_PROFILES.MEDIUM;
    const targetNetPnl = (BASE_EQUITY * profile.annualPct) / 100;
    const days = 365;
    const now = new Date();
    const perfRecords = [];
    let cumTrades = 0;
    let cumWins = 0;
    for (let i = days; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const progress = (days - i) / days;
      const dip = Math.sin(progress * Math.PI * 6) * (targetNetPnl * 0.04);
      const cumPnl = targetNetPnl * progress + dip;
      const tradesToday = i === days ? 0 : 3 + Math.floor(Math.random() * 5);
      const winsToday = Math.round(tradesToday * (profile.win / 100));
      cumTrades += tradesToday;
      cumWins += winsToday;
      const rollingWin = cumTrades > 0 ? (cumWins / cumTrades) * 100 : profile.win;

      perfRecords.push({
        strategyId: st.id,
        date: d,
        winRate: Number(rollingWin.toFixed(1)),
        drawdown: Number(((Math.max(0, -dip) / BASE_EQUITY) * 100).toFixed(2)),
        maxDrawdown: profile.maxDd,
        sharpeRatio: profile.sharpe,
        totalTrades: tradesToday,
        winningTrades: winsToday,
        netPnl: Number(cumPnl.toFixed(2)),
        equityCurve: JSON.stringify([{ time: d.getTime(), value: Number((BASE_EQUITY + cumPnl).toFixed(2)) }])
      });
    }
    await prisma.strategyPerformance.createMany({ data: perfRecords });
  }

  console.log('Seeding Strategy Reviews...');
  const reviewers = [
    { id: u1.id, name: 'Demo Trader' },
    { id: u2.id, name: 'Priya Patel' },
    { id: u5.id, name: 'Ananya Gupta' },
  ];
  const reviewTexts = [
    'Consistent returns over the last 3 months. Drawdowns are well controlled and the entries are clean.',
    'Solid risk management. I copied this on my paper account first and the results matched the live numbers closely.',
    'Great strategy for the price. Win rate is exactly as advertised and support from the creator is responsive.',
    'Took a bit to get used to the volatility but overall very profitable. Highly recommend for trend followers.',
    'One of the better bots on the marketplace. Sharpe ratio held up even during choppy markets.',
  ];
  for (const sId of strategyIds) {
    // 2-3 reviews per strategy, each from a distinct reviewer (unique [strategyId, userId])
    const count = 2 + Math.floor(Math.random() * 2);
    for (let r = 0; r < count; r++) {
      const reviewer = reviewers[r % reviewers.length];
      const rating = 4 + Math.floor(Math.random() * 2); // 4 or 5
      await prisma.strategyReview.create({
        data: {
          strategyId: sId,
          userId: reviewer.id,
          rating,
          reviewText: reviewTexts[Math.floor(Math.random() * reviewTexts.length)],
          creatorReply:
            r === 0
              ? 'Thanks for the feedback! Glad the strategy is working out for you.'
              : null,
          isVisible: true,
        },
      });
    }
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
      initialEquity: 150_000,
    }
  });

  console.log('Seeding Subscriptions...');
  const subs = [strategyIds[0], strategyIds[1], strategyIds[2], strategyIds[4], strategyIds[6]];
  for (let i = 0; i < subs.length; i++) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7 + i * 5);
    await prisma.userStrategySubscription.create({
      data: {
        userId: u1.id,
        strategyId: subs[i],
        brokerAccountId: brokerAccount.id,
        status: SubscriptionStatus.ACTIVE,
        planType: 'MONTHLY',
        expiresAt,
      }
    });
  }

  console.log('Seeding Trades for Demo User...');
  // Realistic per-symbol price levels + tick sizes so entry/exit prices look real
  // and stay consistent with each trade's direction and win/loss outcome.
  const SYMBOL_PRICES: Record<string, number> = {
    EURUSD: 1.0850,
    GBPUSD: 1.2710,
    USDJPY: 156.20,
    XAUUSD: 2330,
    US30: 39250,
  };
  const SYMBOL_TICK: Record<string, number> = {
    EURUSD: 0.0001,
    GBPUSD: 0.0001,
    USDJPY: 0.01,
    XAUUSD: 0.1,
    US30: 1,
  };
  const SYMBOL_DECIMALS: Record<string, number> = {
    EURUSD: 4,
    GBPUSD: 4,
    USDJPY: 2,
    XAUUSD: 2,
    US30: 1,
  };
  const currencies = Object.keys(SYMBOL_PRICES);
  for (let i = 0; i < 200; i++) {
    const symbol = currencies[Math.floor(Math.random() * currencies.length)];
    const isWin = Math.random() > 0.35; // ~65% win rate
    const profit = isWin ? 1200 + Math.random() * 200 : -680 - Math.random() * 100;
    const isOpen = i < 5;
    const status = isOpen ? TradeStatus.OPEN : TradeStatus.CLOSED;
    const direction = Math.random() > 0.5 ? TradeDirection.LONG : TradeDirection.SHORT;

    const base = SYMBOL_PRICES[symbol];
    const tick = SYMBOL_TICK[symbol];
    const decimals = SYMBOL_DECIMALS[symbol];
    const openPrice = Number((base * (1 + (Math.random() - 0.5) * 0.012)).toFixed(decimals));
    const moveTicks = 40 + Math.random() * 140;
    // Price closes in the trade's favour on a win, against it on a loss.
    const favour = isWin ? 1 : -1;
    const dirSign = direction === TradeDirection.LONG ? 1 : -1;
    const closePrice = isOpen
      ? null
      : Number((openPrice + dirSign * favour * moveTicks * tick).toFixed(decimals));
    const volume = Number((0.1 + Math.random() * 1.9).toFixed(2));

    await prisma.trade.create({
      data: {
        userId: u1.id,
        strategyId: subs[Math.floor(Math.random() * subs.length)],
        brokerAccountId: brokerAccount.id,
        symbol,
        direction,
        volume,
        openPrice,
        closePrice,
        profit: isOpen ? null : Number(profit.toFixed(2)),
        status,
        openedAt: new Date(Date.now() - (i * 3600000)),
        closedAt: isOpen ? null : new Date(Date.now() - (i * 3600000 - 1800000)),
      }
    });
  }

  console.log('Seeding Wallet Transactions...');
  // A coherent ledger: opening deposit, recurring strategy-subscription debits,
  // commission/marketplace credits, then recent activity. balanceAfter is computed
  // FORWARD over confirmed transactions so the running balance reconciles exactly
  // with WalletService.getBalance (confirmedIn − confirmedOut). Pending rows are
  // shown in the list but excluded from the confirmed balance.
  type TxSeed = {
    type: TransactionType;
    direction: TransactionDirection;
    amount: number;
    status: TransactionStatus;
    daysAgo: number;
    description: string;
  };
  const subStrategyPrices = [2499, 3999, 1499, 1999]; // paid strategy subscriptions
  const txSeeds: TxSeed[] = [
    { type: TransactionType.DEPOSIT, direction: TransactionDirection.IN, amount: 150000, status: TransactionStatus.CONFIRMED, daysAgo: 96, description: 'Initial wallet funding (UPI)' },
  ];
  // Last 3 months of strategy subscription debits
  for (let m = 3; m >= 1; m--) {
    for (const price of subStrategyPrices) {
      txSeeds.push({ type: TransactionType.SUBSCRIPTION_PAYMENT, direction: TransactionDirection.OUT, amount: price, status: TransactionStatus.CONFIRMED, daysAgo: m * 30 + 2, description: 'Strategy subscription renewal' });
    }
  }
  txSeeds.push(
    { type: TransactionType.COMMISSION, direction: TransactionDirection.IN, amount: 4200, status: TransactionStatus.CONFIRMED, daysAgo: 40, description: 'Affiliate commission payout' },
    { type: TransactionType.MARKETPLACE_SALE, direction: TransactionDirection.IN, amount: 7800, status: TransactionStatus.CONFIRMED, daysAgo: 22, description: 'Marketplace strategy sale' },
    { type: TransactionType.TRADING_PNL, direction: TransactionDirection.IN, amount: 3650, status: TransactionStatus.CONFIRMED, daysAgo: 14, description: 'Realised trading P&L settlement' },
    { type: TransactionType.COMMISSION, direction: TransactionDirection.IN, amount: 2650, status: TransactionStatus.CONFIRMED, daysAgo: 9, description: 'Affiliate commission payout' },
    { type: TransactionType.DEPOSIT, direction: TransactionDirection.IN, amount: 25000, status: TransactionStatus.CONFIRMED, daysAgo: 5, description: 'Wallet top-up (UPI)' },
    { type: TransactionType.WITHDRAWAL, direction: TransactionDirection.OUT, amount: 10000, status: TransactionStatus.PENDING, daysAgo: 1, description: 'Withdrawal to bank (processing)' },
    { type: TransactionType.DEPOSIT, direction: TransactionDirection.IN, amount: 5000, status: TransactionStatus.PENDING, daysAgo: 0, description: 'Wallet top-up (awaiting confirmation)' },
  );
  // Oldest first so the running confirmed balance accumulates correctly.
  txSeeds.sort((a, b) => b.daysAgo - a.daysAgo);
  let confirmedBalance = 0;
  for (let i = 0; i < txSeeds.length; i++) {
    const t = txSeeds[i];
    if (t.status === TransactionStatus.CONFIRMED) {
      confirmedBalance += t.direction === TransactionDirection.IN ? t.amount : -t.amount;
    }
    await prisma.walletTransaction.create({
      data: {
        userId: u1.id,
        type: t.type,
        direction: t.direction,
        amount: t.amount,
        balanceAfter: confirmedBalance,
        status: t.status,
        description: t.description,
        createdAt: new Date(Date.now() - t.daysAgo * 86400000),
        idempotencyKey: `tx-${i}-${randomUUID()}`,
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

  console.log('Seeding Subscription Plans...');
  for (const plan of PLATFORM_PLANS_SEED) {
    if (plan.monthlyPrice < 0) continue;
    await prisma.subscriptionPlan.upsert({
      where: { name: plan.name },
      create: {
        name: plan.name,
        description: plan.description,
        monthlyPrice: plan.monthlyPrice,
        annualPrice: plan.annualPrice,
        features: [...plan.features],
        maxStrategies: plan.maxStrategies,
        maxCopyTrades: plan.maxCopyTrades,
        prioritySupport: plan.prioritySupport,
      },
      update: {
        description: plan.description,
        monthlyPrice: plan.monthlyPrice,
        annualPrice: plan.annualPrice,
        features: [...plan.features],
        maxStrategies: plan.maxStrategies,
        maxCopyTrades: plan.maxCopyTrades,
        prioritySupport: plan.prioritySupport,
      },
    });
  }

  console.log('Seeding Platform Subscription & Payment history...');
  const proPlan = await prisma.subscriptionPlan.findFirst({ where: { name: 'Pro' } });
  if (proPlan) {
    const nextBilling = new Date();
    nextBilling.setDate(nextBilling.getDate() + 18);
    const startedAt = new Date();
    startedAt.setMonth(startedAt.getMonth() - 2);

    // Three settled monthly payments + one upcoming pending payment.
    const paymentPlan = [
      { daysAgo: 78, status: PaymentStatus.COMPLETED },
      { daysAgo: 48, status: PaymentStatus.COMPLETED },
      { daysAgo: 18, status: PaymentStatus.COMPLETED },
    ];
    let lastCompletedPaymentId: string | undefined;
    for (const p of paymentPlan) {
      const created = new Date(Date.now() - p.daysAgo * 86400000);
      const payment = await prisma.payment.create({
        data: {
          userId: u1.id,
          amount: proPlan.monthlyPrice,
          currency: 'INR',
          method: PaymentMethod.UPI,
          status: p.status,
          description: 'Pro plan — monthly subscription',
          createdAt: created,
          completedAt: created,
        },
      });
      lastCompletedPaymentId = payment.id;
    }
    // Upcoming renewal (pending)
    await prisma.payment.create({
      data: {
        userId: u1.id,
        amount: proPlan.monthlyPrice,
        currency: 'INR',
        method: PaymentMethod.UPI,
        status: PaymentStatus.PENDING,
        description: 'Pro plan — upcoming renewal',
        createdAt: nextBilling,
      },
    });

    await prisma.userSubscription.create({
      data: {
        userId: u1.id,
        planId: proPlan.id,
        status: SubscriptionStatus.ACTIVE,
        billingCycle: 'MONTHLY',
        autoRenewal: true,
        subscribedAt: startedAt,
        expiresAt: nextBilling,
        nextBillingAt: nextBilling,
        paymentId: lastCompletedPaymentId,
      },
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

  console.log('Seeding AI workforce budgets & KB...');
  const agentTypes = [
    'CEO', 'PRODUCT', 'CUSTOMER_SUCCESS', 'SUPPORT', 'MARKETING',
    'SEO', 'SECURITY', 'ANALYTICS', 'BILLING', 'DEVOPS',
  ] as const;
  for (const agentType of agentTypes) {
    await prisma.agentBudget.upsert({
      where: { agentType },
      create: {
        agentType,
        dailyTokenCap: agentType === 'CEO' ? 200 : 300,
        dailyCostCapUsd: 0.05,
      },
      update: {},
    });
  }
  const kbArticles = [
    { slug: 'connect-broker', title: 'How to connect MT5 broker', content: 'Go to Copy Trading, click Connect Broker, enter MT5 login and server. Use paper account for risk-free testing.', tags: ['broker', 'mt5', 'paper'] },
    { slug: 'wallet-deposit', title: 'How to fund wallet', content: 'Open Wallet, click Deposit, pay via Razorpay UPI or card. Minimum deposit ₹1000 for referral bonus eligibility.', tags: ['wallet', 'razorpay', 'deposit'] },
    { slug: 'marketplace-subscribe', title: 'Subscribe to a strategy', content: 'Browse Marketplace, open a strategy, click Subscribe. Free strategies available on Starter plan and above for paid listings.', tags: ['marketplace', 'subscribe'] },
    { slug: 'billing-plans', title: 'Platform subscription plans', content: 'Starter ₹3999/mo, Pro ₹11999/mo. Manage at Settings > Billing. 7-day trial on signup from pricing page.', tags: ['billing', 'pricing'] },
  ];
  for (const article of kbArticles) {
    await prisma.supportKnowledgeChunk.upsert({
      where: { slug: article.slug },
      create: article,
      update: { title: article.title, content: article.content, tags: article.tags },
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
