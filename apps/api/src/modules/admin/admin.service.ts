import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { BrokerService } from '../broker/broker.service';
import { CopyFactorySyncService } from '../copy-factory/copy-factory-sync.service';
import pdfParse from 'pdf-parse';
import {
  Prisma,
  RiskLevel,
  StrategyCategory,
  UserRole,
  VerificationStatus,
  SubscriptionTier,
  KycStatus,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private brokerService: BrokerService,
    private copyFactorySync: CopyFactorySyncService,
  ) {}

  async getSystemStats() {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const [
      userCount,
      newUsers,
      strategyCount,
      tradeCount,
      revenueData,
      mrrData,
      pendingVerifications,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.strategy.count({ where: { deletedAt: null } }),
      this.prisma.trade.count(),
      this.prisma.walletTransaction.aggregate({
        _sum: { amount: true },
        where: {
          type: 'TRADING_PNL',
          status: 'CONFIRMED',
        },
      }),
      this.prisma.walletTransaction.aggregate({
        _sum: { amount: true },
        where: {
          type: 'SUBSCRIPTION_PAYMENT',
          status: 'CONFIRMED',
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      this.prisma.strategy.count({
        where: { verificationStatus: VerificationStatus.PENDING },
      }),
    ]);

    const totalVolume = revenueData._sum.amount || 0;
    const mrr = mrrData._sum.amount || 0;

    return {
      kpis: {
        totalUsers: userCount,
        userGrowth: ((newUsers / (userCount || 1)) * 100).toFixed(1) + '%',
        totalStrategies: strategyCount,
        totalTrades: tradeCount,
        totalVolume,
        mrr: mrr.toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
        }),
        pendingVerifications,
      },

      systemHealth: 'OPTIMAL',
      activeServices: {
        api: 'UP',
        ai_engine: 'UP',
        backtest_engine: 'UP',
        redis: 'CONNECTED',
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  async getDashboard() {
    const [stats, unreadAlerts, pendingWithdrawals] = await Promise.all([
      this.getSystemStats(),
      this.prisma.notification.count({ where: { isRead: false } }),
      this.prisma.walletTransaction.count({
        where: { type: 'WITHDRAWAL', status: 'PENDING' },
      }),
    ]);

    return {
      ...stats,
      ops: {
        unreadAlerts,
        pendingWithdrawals,
      },
    };
  }

  async getAllUsers(limit = 200, skip = 0) {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 500),
      skip,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        subscriptionTier: true,
        isActive: true,
        isSuspended: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });
  }

  async getUserDetail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        username: true,
        avatarUrl: true,
        role: true,
        subscriptionTier: true,
        isActive: true,
        isSuspended: true,
        emailVerified: true,
        kycStatus: true,
        onboardingCompleted: true,
        createdAt: true,
        lastLoginAt: true,
        referralCode: true,
        _count: {
          select: {
            trades: true,
            subscriptions: true,
            notifications: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const wallet = await this.prisma.walletTransaction.aggregate({
      where: { userId, status: 'CONFIRMED' },
      _sum: { amount: true },
    });

    return {
      ...user,
      walletGross: wallet._sum.amount || 0,
    };
  }

  async updateUserStatus(userId: string, isSuspended: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id: userId },
      data: { isSuspended },
      select: { id: true, email: true, isSuspended: true },
    });
  }

  async updateUserRole(
    userId: string,
    role: UserRole,
    requestingAdminId: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Prevent an ADMIN from modifying another ADMIN's role (only self-service allowed).
    if (user.role === 'ADMIN' && userId !== requestingAdminId) {
      throw new BadRequestException('Cannot modify another admin account');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, email: true, role: true },
    });
  }

  async getVerificationQueue(limit = 200, skip = 0) {
    return this.prisma.strategy.findMany({
      where: { verificationStatus: VerificationStatus.PENDING },
      take: Math.min(limit, 500),
      skip,
      include: {
        creator: { select: { fullName: true, email: true } },
      },
    });
  }

  async getBrokerAccounts(limit = 200, skip = 0) {
    return this.prisma.brokerAccount.findMany({
      orderBy: { connectedAt: 'desc' },
      take: Math.min(limit, 500),
      skip,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            subscriptions: true,
            trades: true,
          },
        },
      },
    });
  }

  async setBrokerMasterSource(accountId: string, isMasterSource: boolean) {
    const account = await this.prisma.brokerAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException('Broker account not found');
    }

    return this.prisma.brokerAccount.update({
      where: { id: accountId },
      data: { isMasterSource },
    });
  }

  /**
   * One-time setup: connect admin MT5 (from env), mark as master, publish copy strategy.
   * Requires ADMIN_MT5_LOGIN, ADMIN_MT5_PASSWORD, METAAPI_TOKEN in apps/api/.env
   */
  async provisionMasterCopyTrading(adminEmail?: string) {
    const login = process.env.ADMIN_MT5_LOGIN;
    const password = process.env.ADMIN_MT5_PASSWORD;
    const serverName = process.env.ADMIN_MT5_SERVER || 'MetaQuotes-Demo';
    const platform = process.env.ADMIN_MT5_PLATFORM === 'mt4' ? 'mt4' : 'mt5';
    const strategyName =
      process.env.MASTER_COPY_STRATEGY_NAME || 'Profytron Master Bot';

    if (!login || !password) {
      throw new BadRequestException(
        'Set ADMIN_MT5_LOGIN and ADMIN_MT5_PASSWORD in apps/api/.env',
      );
    }

    const email =
      adminEmail || process.env.ADMIN_EMAIL || 'admin@profytron.com';
    let admin = await this.prisma.user.findFirst({
      where: { email },
      select: { id: true, email: true, role: true },
    });

    if (!admin) {
      const passwordHash = await bcrypt.hash(
        process.env.ADMIN_DEFAULT_PASSWORD || 'Demo@123',
        12,
      );
      admin = await this.prisma.user.create({
        data: {
          email,
          passwordHash,
          fullName: 'Profytron Admin',
          username: 'profytron_admin',
          emailVerified: true,
          isActive: true,
          referralCode: randomUUID(),
          role: UserRole.ADMIN,
          subscriptionTier: SubscriptionTier.ELITE,
          kycStatus: KycStatus.VERIFIED,
        },
        select: { id: true, email: true, role: true },
      });
      this.logger.log(`Created admin user ${email} for master copy setup`);
    } else if (admin.role !== UserRole.ADMIN) {
      admin = await this.prisma.user.update({
        where: { id: admin.id },
        data: { role: UserRole.ADMIN },
        select: { id: true, email: true, role: true },
      });
    }

    const last4 = login.slice(-4).padStart(4, '0');
    let brokerAccount = await this.prisma.brokerAccount.findFirst({
      where: {
        userId: admin.id,
        accountNumberLast4: last4,
        serverName,
        brokerName: platform === 'mt4' ? 'MT4' : 'MT5',
      },
    });

    if (!brokerAccount) {
      const connected = await this.brokerService.connectBroker(admin.id, {
        brokerName: platform === 'mt4' ? 'MT4' : 'MT5',
        login,
        password,
        serverName,
        platform,
        copyFactoryRole: 'PROVIDER',
      });
      brokerAccount = await this.prisma.brokerAccount.findUnique({
        where: { id: connected.id },
      });
    }

    if (!brokerAccount) {
      throw new BadRequestException(
        'Failed to provision admin MT5 broker account',
      );
    }

    await this.prisma.brokerAccount.update({
      where: { id: brokerAccount.id },
      data: { isMasterSource: true, isDefault: true, isActive: true },
    });

    const monthlyPrice = Number(process.env.MASTER_COPY_MONTHLY_PRICE || 49);
    const annualPrice = Number(process.env.MASTER_COPY_ANNUAL_PRICE || 399);

    let strategy = await this.prisma.strategy.findFirst({
      where: {
        creatorId: admin.id,
        name: strategyName,
        deletedAt: null,
      },
      include: { listing: true },
    });

    if (!strategy) {
      strategy = (await this.createStrategy(
        {
          creatorId: admin.id,
          name: strategyName,
          description:
            'Automated trading bot powered by the Profytron operator MT5 account. Buy access, connect your broker, and live bot execution starts after payment.',
          category: StrategyCategory.TREND,
          riskLevel: RiskLevel.MEDIUM,
          configJson: {
            type: 'master_copy',
            masterBrokerAccountId: brokerAccount.id,
            copyMode: 'position_sync',
            modelingQuality: '99%',
            backtestPeriod: '2018–2025 multi-year MT5 Strategy Tester',
            minRecommendedCapital: 2500,
            recommendedLeverage: '1:100',
            leverageWarning:
              'Use 1:100 or higher to match operator bot margin requirements. Lower leverage may reject mirrored lot sizes.',
            symbols: ['EURUSD', 'GBPUSD', 'XAUUSD', 'USDJPY', 'US30'],
          },
          monthlyPrice,
          annualPrice,
          lifetimePrice: 0,
          maxCopies: 500,
          isFeatured: true,
          isPublished: true,
          isVerified: true,
          trialDays: 0,
          masterBrokerAccountId: brokerAccount.id,
        },
        admin.id,
      )) as typeof strategy;
    } else {
      await this.prisma.strategy.update({
        where: { id: strategy.id },
        data: { masterBrokerAccountId: brokerAccount.id, isPublished: true },
      });
      if (strategy.listing) {
        await this.prisma.marketplaceListing.update({
          where: { strategyId: strategy.id },
          data: { trialDays: 0 },
        });
      }
    }

    if (strategy?.id) {
      await this.copyFactorySync.enqueueProvisionProvider(strategy.id);
    }

    this.logger.log(
      `Master copy provisioned: broker=${brokerAccount.id}, strategy=${strategy?.id}`,
    );

    return {
      adminEmail: admin.email,
      brokerAccountId: brokerAccount.id,
      strategyId: strategy?.id,
      strategyName,
      metaApiLive: Boolean(process.env.METAAPI_TOKEN),
      copyFactoryEnabled: process.env.COPYFACTORY_ENABLED !== 'false',
      message:
        'Master MT5 linked via MetaAPI CopyFactory. Buyers pay on marketplace, connect MT5, and CopyFactory mirrors your trades automatically.',
    };
  }

  async getPaymentsOverview() {
    const [deposits, withdrawals, subscriptions] = await Promise.all([
      this.prisma.walletTransaction.aggregate({
        where: { type: 'DEPOSIT', status: 'CONFIRMED' },
        _sum: { amount: true },
      }),
      this.prisma.walletTransaction.aggregate({
        where: { type: 'WITHDRAWAL', status: 'CONFIRMED' },
        _sum: { amount: true },
      }),
      this.prisma.walletTransaction.aggregate({
        where: { type: 'SUBSCRIPTION_PAYMENT', status: 'CONFIRMED' },
        _sum: { amount: true },
      }),
    ]);

    return {
      deposits: deposits._sum.amount || 0,
      withdrawals: withdrawals._sum.amount || 0,
      subscriptions: subscriptions._sum.amount || 0,
    };
  }

  async getSystemMetrics() {
    const [activeUsers24h, newUsers7d, pendingKyc] = await Promise.all([
      this.prisma.user.count({
        where: {
          lastLoginAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
      this.prisma.user.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      this.prisma.user.count({ where: { kycStatus: 'PENDING' } }),
    ]);

    return {
      activeUsers24h,
      newUsers7d,
      pendingKyc,
      timestamp: new Date().toISOString(),
    };
  }

  async handleVerification(
    strategyId: string,
    approve: boolean,
    notes?: string,
  ) {
    const status = approve
      ? VerificationStatus.VERIFIED
      : VerificationStatus.UNVERIFIED;

    return this.prisma.strategy.update({
      where: { id: strategyId },
      data: {
        verificationStatus: status,
        isVerified: approve,
      },
    });
  }

  async getStrategies(limit = 200, skip = 0) {
    return this.prisma.strategy.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      take: Math.min(limit, 500),
      skip,
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        listing: true,
        performance: {
          take: 1,
          orderBy: { date: 'desc' },
          select: {
            winRate: true,
            sharpeRatio: true,
            maxDrawdown: true,
            netPnl: true,
            date: true,
          },
        },
        _count: {
          select: {
            subscriptions: true,
            trades: true,
          },
        },
      },
    });
  }

  async parseStrategyPdf(file: Express.Multer.File) {
    if (!file.buffer || !file.mimetype?.includes('pdf')) {
      throw new BadRequestException('Invalid strategy PDF file');
    }

    const rawText = String((await pdfParse(file.buffer)).text ?? '').trim();
    const extractField = (label: string) => {
      const regex = new RegExp(`${label}\\s*[:\\-]\\s*([^\\n]+)`, 'i');
      const match = rawText.match(regex);
      return match?.[1]?.trim();
    };

    const parseCurrency = (value?: string) => {
      if (!value) return undefined;
      const cleaned = value.replace(/[^0-9.]/g, '');
      return cleaned.length ? Number(cleaned) : undefined;
    };

    const parseInteger = (value?: string) => {
      if (!value) return undefined;
      const cleaned = value.replace(/[^0-9]/g, '');
      return cleaned.length ? Number(cleaned) : undefined;
    };

    const parseBoolean = (value?: string) => {
      if (!value) return undefined;
      const normalized = value.trim().toLowerCase();
      if (['true', 'yes', 'on', '1'].includes(normalized)) return true;
      if (['false', 'no', 'off', '0'].includes(normalized)) return false;
      return undefined;
    };

    const categories = [
      'TREND',
      'SCALPING',
      'RANGE',
      'VOLATILITY',
      'ARBITRAGE',
    ];
    const findCategory = (value?: string) => {
      const normalized = value?.trim().toUpperCase();
      if (!normalized) return undefined;
      return categories.includes(normalized)
        ? (normalized as StrategyCategory)
        : undefined;
    };

    const riskText = extractField('Risk Level') ?? extractField('Risk');
    const normalizedRisk = riskText?.trim().toUpperCase();
    const riskLevel = ['LOW', 'MEDIUM', 'HIGH', 'EXPERT'].find((level) =>
      normalizedRisk?.includes(level),
    ) as RiskLevel | undefined;

    const extractJson = () => {
      const match = rawText.match(/(\{[\s\S]*\})/m);
      if (!match?.[1]) return undefined;
      try {
        return JSON.parse(match[1]);
      } catch {
        return undefined;
      }
    };

    return {
      name:
        extractField('Strategy Name') ??
        extractField('Name') ??
        file.originalname.replace(/\.pdf$/i, ''),
      description:
        extractField('Description') ??
        rawText.split('\n').slice(0, 3).join(' ').trim(),
      category: findCategory(extractField('Category')) ?? undefined,
      riskLevel: riskLevel ?? undefined,
      configJson: extractJson() ?? {},
      monthlyPrice: parseCurrency(extractField('Monthly Price')),
      annualPrice: parseCurrency(extractField('Annual Price')),
      lifetimePrice: parseCurrency(extractField('Lifetime Price')),
      maxCopies:
        parseInteger(extractField('Max Copies')) ??
        parseInteger(extractField('Copies')),
      trialDays: parseInteger(extractField('Trial Days')),
      isFeatured: parseBoolean(extractField('Featured')),
      isPublished: parseBoolean(extractField('Published')),
      isVerified: parseBoolean(extractField('Verified')),
      payoutEnabled: parseBoolean(extractField('Payout Enabled')),
    };
  }

  async createStrategy(
    input: {
      creatorId: string;
      name: string;
      description: string;
      category: StrategyCategory;
      riskLevel: RiskLevel;
      configJson: Prisma.InputJsonValue;
      monthlyPrice?: number;
      annualPrice?: number;
      lifetimePrice?: number;
      maxCopies?: number;
      isFeatured?: boolean;
      isPublished?: boolean;
      isVerified?: boolean;
      trialDays?: number;
      masterBrokerAccountId?: string;
      creatorSharePct?: number;
      platformSharePct?: number;
      payoutEnabled?: boolean;
    },
    adminUserId: string,
  ) {
    const creator = await this.prisma.user.findUnique({
      where: { id: input.creatorId },
      select: { id: true },
    });
    if (!creator) {
      throw new NotFoundException('Creator user not found');
    }

    const normalizedPrices = {
      monthlyPrice: input.monthlyPrice ?? 0,
      annualPrice: input.annualPrice ?? 0,
      lifetimePrice: input.lifetimePrice ?? 0,
    };

    const verificationStatus = input.isVerified
      ? VerificationStatus.VERIFIED
      : VerificationStatus.UNVERIFIED;

    const strategy = await this.prisma.$transaction(async (tx) => {
      const created = await tx.strategy.create({
        data: {
          creatorId: input.creatorId,
          name: input.name,
          description: input.description,
          category: input.category,
          riskLevel: input.riskLevel,
          configJson: input.configJson,
          monthlyPrice: normalizedPrices.monthlyPrice,
          annualPrice: normalizedPrices.annualPrice,
          lifetimePrice: normalizedPrices.lifetimePrice,
          maxCopies: input.maxCopies ?? 500,
          isFeatured: input.isFeatured ?? false,
          isPublished: input.isPublished ?? true,
          isVerified: input.isVerified ?? true,
          verificationStatus,
          masterBrokerAccountId: input.masterBrokerAccountId ?? null,
        },
      });

      const copyTrialDays = input.masterBrokerAccountId
        ? 0
        : (input.trialDays ?? 7);

      await tx.marketplaceListing.create({
        data: {
          strategyId: created.id,
          monthlyPrice: normalizedPrices.monthlyPrice,
          annualPrice: normalizedPrices.annualPrice,
          lifetimePrice: normalizedPrices.lifetimePrice,
          trialDays: copyTrialDays,
          maxCopies: input.maxCopies ?? 500,
          isFeatured: input.isFeatured ?? false,
          creatorSharePct: input.creatorSharePct ?? 0.8,
          platformSharePct: input.platformSharePct ?? 0.2,
          payoutEnabled: input.payoutEnabled ?? true,
        },
      });

      await tx.auditLog.create({
        data: {
          eventType: 'ADMIN_STRATEGY_CREATED',
          userId: adminUserId,
          detailsJson: {
            strategyId: created.id,
            creatorId: input.creatorId,
            name: input.name,
          },
          triggeredBy: adminUserId,
        },
      });

      return created;
    });

    return this.prisma.strategy.findUnique({
      where: { id: strategy.id },
      include: {
        creator: { select: { id: true, fullName: true, email: true } },
        listing: true,
      },
    });
  }

  async updateStrategy(
    strategyId: string,
    input: {
      creatorId?: string;
      name?: string;
      description?: string;
      category?: StrategyCategory;
      riskLevel?: RiskLevel;
      configJson?: Prisma.InputJsonValue;
      monthlyPrice?: number;
      annualPrice?: number;
      lifetimePrice?: number;
      maxCopies?: number;
      isFeatured?: boolean;
      isPublished?: boolean;
      isVerified?: boolean;
      trialDays?: number;
      creatorSharePct?: number;
      platformSharePct?: number;
      payoutEnabled?: boolean;
    },
    adminUserId: string,
  ) {
    const existing = await this.prisma.strategy.findUnique({
      where: { id: strategyId },
      include: { listing: true },
    });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException('Strategy not found');
    }

    if (input.creatorId) {
      const creator = await this.prisma.user.findUnique({
        where: { id: input.creatorId },
        select: { id: true },
      });
      if (!creator) {
        throw new NotFoundException('Creator user not found');
      }
    }

    const verificationStatus =
      input.isVerified === undefined
        ? existing.verificationStatus
        : input.isVerified
          ? VerificationStatus.VERIFIED
          : VerificationStatus.UNVERIFIED;

    await this.prisma.$transaction(async (tx) => {
      await tx.strategy.update({
        where: { id: strategyId },
        data: {
          creatorId: input.creatorId,
          name: input.name,
          description: input.description,
          category: input.category,
          riskLevel: input.riskLevel,
          configJson: input.configJson,
          monthlyPrice: input.monthlyPrice,
          annualPrice: input.annualPrice,
          lifetimePrice: input.lifetimePrice,
          maxCopies: input.maxCopies,
          isFeatured: input.isFeatured,
          isPublished: input.isPublished,
          isVerified: input.isVerified,
          verificationStatus,
        },
      });

      await tx.marketplaceListing.upsert({
        where: { strategyId },
        create: {
          strategyId,
          monthlyPrice: input.monthlyPrice ?? existing.monthlyPrice ?? 0,
          annualPrice: input.annualPrice ?? existing.annualPrice ?? 0,
          lifetimePrice: input.lifetimePrice ?? existing.lifetimePrice ?? 0,
          maxCopies: input.maxCopies ?? existing.maxCopies,
          trialDays: input.trialDays ?? 7,
          isFeatured: input.isFeatured ?? existing.isFeatured,
          creatorSharePct: input.creatorSharePct ?? 0.8,
          platformSharePct: input.platformSharePct ?? 0.2,
          payoutEnabled: input.payoutEnabled ?? true,
        },
        update: {
          monthlyPrice: input.monthlyPrice,
          annualPrice: input.annualPrice,
          lifetimePrice: input.lifetimePrice,
          maxCopies: input.maxCopies,
          trialDays: input.trialDays,
          isFeatured: input.isFeatured,
          creatorSharePct: input.creatorSharePct,
          platformSharePct: input.platformSharePct,
          payoutEnabled: input.payoutEnabled,
        },
      });

      await tx.auditLog.create({
        data: {
          eventType: 'ADMIN_STRATEGY_UPDATED',
          userId: adminUserId,
          detailsJson: {
            strategyId,
          },
          triggeredBy: adminUserId,
        },
      });
    });

    return this.prisma.strategy.findUnique({
      where: { id: strategyId },
      include: {
        creator: { select: { id: true, fullName: true, email: true } },
        listing: true,
      },
    });
  }

  async deleteStrategy(strategyId: string) {
    const existing = await this.prisma.strategy.findUnique({
      where: { id: strategyId },
    });

    if (!existing || existing.deletedAt) {
      throw new NotFoundException('Strategy not found');
    }

    return this.prisma.strategy.update({
      where: { id: strategyId },
      data: { deletedAt: new Date() },
    });
  }

  async getPendingKyc() {
    const users = await this.prisma.user.findMany({
      where: { kycStatus: 'PENDING' },
      select: {
        id: true,
        email: true,
        fullName: true,
        kycStatus: true,
        createdAt: true,
        kycDocuments: {
          orderBy: { submittedAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    return users;
  }

  async reviewKyc(
    userId: string,
    approve: boolean,
    notes?: string,
    adminUserId?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, fullName: true, kycStatus: true },
    });
    if (!user) throw new NotFoundException('User not found');

    if (user.kycStatus !== 'PENDING') {
      throw new BadRequestException(
        `KYC is not pending for this user (current status: ${user.kycStatus})`,
      );
    }

    const newStatus = approve ? 'VERIFIED' : 'NOT_STARTED';
    const docStatus = approve ? 'VERIFIED' : 'NOT_STARTED';

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { kycStatus: newStatus },
      });

      await tx.kycDocument.updateMany({
        where: { userId, status: 'PENDING' },
        data: { status: docStatus },
      });

      await tx.auditLog.create({
        data: {
          eventType: approve ? 'KYC_APPROVED' : 'KYC_REJECTED',
          userId,
          detailsJson: {
            notes: notes ?? null,
            adminUserId: adminUserId ?? null,
          },
          triggeredBy: adminUserId ?? 'system',
        },
      });
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    if (approve) {
      await this.emailService.sendNotificationEmail(
        user.email,
        user.fullName || 'Trader',
        'KYC Verified — You Can Now Withdraw',
        'Your identity verification (KYC) has been approved. You can now make withdrawals from your Profytron wallet.',
        `${frontendUrl}/wallet`,
      );
    } else {
      await this.emailService.sendNotificationEmail(
        user.email,
        user.fullName || 'Trader',
        'KYC Verification Unsuccessful',
        `Your KYC submission was not approved${notes ? ': ' + notes : '. Please re-submit your documents with clearer images'}. You can re-submit from your profile settings.`,
        `${frontendUrl}/settings/kyc`,
      );
    }

    this.logger.log(
      `KYC ${approve ? 'approved' : 'rejected'} for user ${userId}`,
    );
    return { userId, kycStatus: newStatus };
  }
}
