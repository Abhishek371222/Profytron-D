import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { getTierLimits } from '../../common/constants/pricing.constants';
import { RedisService } from '../auth/redis.service';
import { CopyFactorySyncService } from '../copy-factory/copy-factory-sync.service';
import { BacktestService } from '../backtest/backtest.service';
import { AiRiskService } from '../ai-risk/ai-risk.service';
import {
  CreateStrategyDto,
  UpdateStrategyDto,
  StrategiesQueryDto,
  ActivateStrategyDto,
  RunBacktestDto,
  WalkForwardValidationDto,
  SensitivityAnalysisDto,
} from './dto/strategy.dto';
import {
  UserRole,
  SubscriptionStatus,
  VerificationStatus,
  TradeStatus,
} from '@prisma/client';
import axios from 'axios';
import * as crypto from 'crypto';
import {
  findActiveLiveBroker,
  findAnyActiveBroker,
  linkOrphanStrategySubscriptions,
} from '../../common/utils/broker-requirement.util';

@Injectable()
export class StrategiesService {
  private readonly logger = new Logger(StrategiesService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private copyFactorySync: CopyFactorySyncService,
    private backtestSvc: BacktestService,
    private aiRisk: AiRiskService,
  ) {}

  async findAll(query: StrategiesQueryDto, userId?: string) {
    const cacheKey = `cache:strategies:${this.hashObject(query)}`;
    if (!userId) {
      const cached = await this.redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    }

    const {
      category,
      riskLevel,
      isVerified,
      priceMin,
      priceMax,
      search,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 20,
    } = query;

    const skip = (page - 1) * limit;
    const requestedSortBy = String(sortBy);
    const requestedOrder = order === 'asc' ? 'asc' : 'desc';
    const scalarSortFields = new Set([
      'createdAt',
      'updatedAt',
      'monthlyPrice',
      'copiesCount',
      'totalRevenue',
      'name',
      'riskLevel',
      'category',
    ]);
    const performanceSortFields = new Set([
      'winRate',
      'sharpeRatio',
      'maxDrawdown',
      'netPnl',
    ]);

    const where: any = {
      deletedAt: null,
      isPublished: true,
    };

    if (category) where.category = category;
    if (riskLevel) where.riskLevel = riskLevel;
    if (isVerified !== undefined) where.isVerified = isVerified;

    if (priceMin !== undefined || priceMax !== undefined) {
      where.monthlyPrice = {
        gte: priceMin || 0,
        lte: priceMax || 1000000,
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Deliberately loosely typed: both branches below use a `select` (not
    // `include`) that omits heavy/internal columns (configJson, biasCheckJson,
    // etc.), so the shape is a strict subset of the full `Strategy` model.
    let strategies: Array<Record<string, any>> = [];
    let total = 0;

    // Public browse/marketplace listing — never needs the bot's internal
    // config or bias-check payload (each can be tens of KB of JSON per row).
    // Explicit `select` keeps this list endpoint's response and Redis cache
    // entry small regardless of how many strategies match the filter.
    const listSelect = {
      id: true,
      creatorId: true,
      name: true,
      description: true,
      category: true,
      riskLevel: true,
      assetClass: true,
      timeframe: true,
      isPublished: true,
      verificationStatus: true,
      isVerified: true,
      monthlyPrice: true,
      annualPrice: true,
      lifetimePrice: true,
      maxCopies: true,
      copiesCount: true,
      totalRevenue: true,
      isFeatured: true,
      createdAt: true,
      updatedAt: true,
    } as const;

    if (performanceSortFields.has(requestedSortBy)) {
      const perfField = requestedSortBy as
        | 'winRate'
        | 'sharpeRatio'
        | 'maxDrawdown'
        | 'netPnl';

      const [allStrategies, count] = await Promise.all([
        this.prisma.strategy.findMany({
          where,
          select: {
            ...listSelect,
            creator: { select: { id: true, fullName: true, avatarUrl: true } },
            performance: { take: 1, orderBy: { date: 'desc' } },
            subscriptions: userId
              ? {
                  where: { userId, status: SubscriptionStatus.ACTIVE },
                  take: 1,
                }
              : false,
          },
        }),
        this.prisma.strategy.count({ where }),
      ]);

      const metric = (s: (typeof allStrategies)[number]) => {
        const value = Number(s.performance?.[0]?.[perfField] ?? 0);
        return Number.isFinite(value) ? value : 0;
      };

      allStrategies.sort((a, b) => {
        const diff =
          requestedOrder === 'asc'
            ? metric(a) - metric(b)
            : metric(b) - metric(a);
        if (diff !== 0) return diff;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

      strategies = allStrategies.slice(skip, skip + limit);
      total = count;
    } else {
      const sortField = scalarSortFields.has(requestedSortBy)
        ? requestedSortBy
        : 'createdAt';

      const [pagedStrategies, count] = await Promise.all([
        this.prisma.strategy.findMany({
          where,
          select: {
            ...listSelect,
            creator: { select: { id: true, fullName: true, avatarUrl: true } },
            performance: {
              take: 1,
              orderBy: { date: 'desc' },
            },
            subscriptions: userId
              ? {
                  where: { userId, status: SubscriptionStatus.ACTIVE },
                  take: 1,
                }
              : false,
          },
          skip,
          take: limit,
          orderBy: { [sortField]: requestedOrder },
        }),
        this.prisma.strategy.count({ where }),
      ]);

      strategies = pagedStrategies;
      total = count;
    }

    const result = {
      strategies: strategies.map((s) => ({
        ...s,
        isSubscribed: (s.subscriptions?.length ?? 0) > 0,
        latestPerformance: s.performance[0] || null,
        performance: undefined,
        subscriptions: undefined,
      })),
      total,
      page,
      limit,
    };

    if (!userId) {
      await this.redis.set(cacheKey, JSON.stringify(result), 60);
    }

    return result;
  }

  async findById(id: string, userId?: string) {
    const strategy = await this.prisma.strategy.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, fullName: true, avatarUrl: true, bio: true },
        },
        performance: {
          orderBy: { date: 'asc' },
        },
        listing: true,
        reviews: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { fullName: true, avatarUrl: true } } },
        },
        subscriptions: userId
          ? {
              where: { userId, status: SubscriptionStatus.ACTIVE },
            }
          : false,
      },
    });

    if (!strategy || strategy.deletedAt)
      throw new NotFoundException('Strategy not found');

    if (!strategy.isPublished && strategy.creatorId !== userId) {
      throw new NotFoundException('Strategy not found');
    }

    const monthlyReturns = this.calculateMonthlyReturns(strategy.performance);

    const equityCurve = strategy.performance.map((p) => ({
      date: p.date,
      value: p.netPnl,
    }));

    return {
      ...strategy,
      equityCurve,
      monthlyReturns,
      isSubscribed: strategy.subscriptions?.length > 0,
      userSubscription: strategy.subscriptions?.[0] || null,
    };
  }

  async create(creatorId: string, dto: CreateStrategyDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: creatorId },
      select: { role: true, subscriptionTier: true },
    });
    if (!user) throw new NotFoundException('User identity not found');

    if (user.role === UserRole.USER) {
      const { maxStrategies } = getTierLimits(user.subscriptionTier);
      const ownedCount = await this.prisma.strategy.count({
        where: { creatorId, deletedAt: null },
      });
      if (ownedCount >= maxStrategies) {
        throw new ForbiddenException(
          `Your plan allows ${maxStrategies} strategy deployment(s). Upgrade to create more.`,
        );
      }
    }

    return this.prisma.strategy.create({
      data: {
        name: dto.name,
        category: dto.category,
        riskLevel: dto.riskLevel,
        assetClass: dto.assetClass ?? null,
        timeframe: dto.timeframe ?? null,
        description: dto.description,
        creatorId,
        configJson: dto.configJson || {},
        monthlyPrice: dto.monthlyPrice ?? null,
        annualPrice: dto.annualPrice ?? null,
      },
    });
  }

  async getCreatedStrategies(creatorId: string) {
    const strategies = await this.prisma.strategy.findMany({
      where: { creatorId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: { id: true, fullName: true, avatarUrl: true, bio: true },
        },
        listing: true,
        performance: { take: 1, orderBy: { date: 'desc' } },
        _count: { select: { subscriptions: true, reviews: true } },
      },
    });

    const items = strategies.map((s) => {
      const { _count, performance, listing, ...rest } = s;
      return {
        ...rest,
        monthlyPrice: s.monthlyPrice != null ? Number(s.monthlyPrice) : 0,
        annualPrice: s.annualPrice != null ? Number(s.annualPrice) : 0,
        lifetimePrice: s.lifetimePrice != null ? Number(s.lifetimePrice) : 0,
        copiesCount: _count.subscriptions,
        reviewCount: _count.reviews,
        latestPerformance: performance[0]
          ? {
              ...performance[0],
              netPnl: Number(performance[0].netPnl ?? 0),
              winRate: Number(performance[0].winRate ?? 0),
              sharpeRatio: Number(performance[0].sharpeRatio ?? 0),
              maxDrawdown: Number(performance[0].maxDrawdown ?? 0),
            }
          : null,
        listing: listing
          ? {
              ...listing,
              monthlyPrice: Number(listing.monthlyPrice ?? 0),
              annualPrice: Number(listing.annualPrice ?? 0),
              lifetimePrice: Number(listing.lifetimePrice ?? 0),
            }
          : null,
      };
    });

    return { items, total: items.length };
  }

  async update(id: string, userId: string, dto: UpdateStrategyDto) {
    const strategy = await this.prisma.strategy.findUnique({ where: { id } });
    if (!strategy || strategy.creatorId !== userId) {
      throw new ForbiddenException('Not your strategy');
    }

    const data: any = { ...dto };

    if (dto.configJson && strategy.isVerified) {
      data.isVerified = false;
      data.verificationStatus = VerificationStatus.PENDING;
    }

    return this.prisma.strategy.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, userId: string) {
    const strategy = await this.prisma.strategy.findUnique({ where: { id } });
    if (!strategy || strategy.creatorId !== userId)
      throw new ForbiddenException();

    await this.prisma.$transaction([
      this.prisma.strategy.update({
        where: { id },
        data: { deletedAt: new Date() },
      }),
      this.prisma.userStrategySubscription.updateMany({
        where: { strategyId: id, status: SubscriptionStatus.ACTIVE },
        data: { status: SubscriptionStatus.CANCELLED, cancelledAt: new Date() },
      }),
    ]);

    return { success: true };
  }

  async activate(strategyId: string, userId: string, dto: ActivateStrategyDto) {
    const strategy = await this.prisma.strategy.findUnique({
      where: { id: strategyId },
      select: {
        id: true,
        isPublished: true,
        masterBrokerAccountId: true,
      },
    });
    if (!strategy || !strategy.isPublished)
      throw new NotFoundException('Strategy not available');

    const existing = await this.prisma.userStrategySubscription.findUnique({
      where: { userId_strategyId: { userId, strategyId } },
    });

    let brokerAccountId = dto.brokerAccountId ?? null;
    if (!brokerAccountId && !dto.isPaperTrading) {
      const live = await findActiveLiveBroker(this.prisma, userId);
      brokerAccountId = live?.id ?? null;
    }
    if (!brokerAccountId && dto.isPaperTrading) {
      const any = await findAnyActiveBroker(this.prisma, userId);
      brokerAccountId = any?.id ?? null;
    }

    if (strategy.masterBrokerAccountId) {
      if (
        !existing ||
        existing.status !== SubscriptionStatus.ACTIVE ||
        !existing.stripeSubId
      ) {
        throw new ForbiddenException(
          'Purchase this copy strategy on the marketplace before linking a broker account.',
        );
      }
      const updated = await this.prisma.userStrategySubscription.update({
        where: { id: existing.id },
        data: { brokerAccountId: brokerAccountId ?? existing.brokerAccountId },
      });
      await this.copyFactorySync.enqueueLinkSubscription(updated.id);
      return updated;
    }

    if (existing && existing.status === SubscriptionStatus.ACTIVE) {
      return this.prisma.userStrategySubscription.update({
        where: { id: existing.id },
        data: {
          brokerAccountId: brokerAccountId ?? existing.brokerAccountId,
        },
      });
    }

    const sub = await this.prisma.userStrategySubscription.upsert({
      where: { userId_strategyId: { userId, strategyId } },
      create: {
        userId,
        strategyId,
        brokerAccountId,
        status: SubscriptionStatus.ACTIVE,
      },
      update: {
        status: SubscriptionStatus.ACTIVE,
        brokerAccountId: brokerAccountId ?? undefined,
        subscribedAt: new Date(),
      },
    });

    this.logger.log(
      `STRATEGY_ACTIVATED: User ${userId} -> Strategy ${strategyId}`,
    );
    return sub;
  }

  async deactivate(strategyId: string, userId: string) {
    const sub = await this.prisma.userStrategySubscription.update({
      where: { userId_strategyId: { userId, strategyId } },
      data: { status: SubscriptionStatus.CANCELLED, cancelledAt: new Date() },
    });

    await this.copyFactorySync.enqueueUnlinkSubscription(sub.id);

    this.logger.log(
      `STRATEGY_DEACTIVATED: User ${userId} -> Strategy ${strategyId}`,
    );
    return { success: true };
  }

  async pause(strategyId: string, userId: string) {
    const sub = await this.prisma.userStrategySubscription.update({
      where: { userId_strategyId: { userId, strategyId } },
      data: { status: SubscriptionStatus.PAUSED },
    });

    await this.copyFactorySync.enqueueUnlinkSubscription(sub.id);

    this.logger.log(
      `STRATEGY_PAUSED: User ${userId} -> Strategy ${strategyId}`,
    );
    return { success: true };
  }

  async resume(strategyId: string, userId: string) {
    const evaluation = await this.aiRisk.evaluatePreTrade(userId);
    if (evaluation.hardStop) {
      throw new ForbiddenException(
        evaluation.reason ??
          'Risk limits are still breached. Resolve the breach before resuming.',
      );
    }

    const sub = await this.prisma.userStrategySubscription.update({
      where: { userId_strategyId: { userId, strategyId } },
      data: { status: SubscriptionStatus.ACTIVE },
      include: {
        strategy: { select: { masterBrokerAccountId: true } },
      },
    });

    if (sub.strategy.masterBrokerAccountId) {
      await this.copyFactorySync.enqueueLinkSubscription(sub.id);
    }

    this.logger.log(
      `STRATEGY_RESUMED: User ${userId} -> Strategy ${strategyId}`,
    );
    return { success: true };
  }

  private autoRenewKey(userId: string, strategyId: string) {
    return `subscription:autorenew:${userId}:${strategyId}`;
  }

  async setAutoRenew(strategyId: string, userId: string, autoRenew: boolean) {
    const sub = await this.prisma.userStrategySubscription.findUnique({
      where: { userId_strategyId: { userId, strategyId } },
      select: { id: true },
    });
    if (!sub) {
      throw new NotFoundException('Subscription not found');
    }
    await this.redis.set(
      this.autoRenewKey(userId, strategyId),
      autoRenew ? '1' : '0',
    );
    this.logger.log(
      `AUTO_RENEW_${autoRenew ? 'ENABLED' : 'DISABLED'}: User ${userId} -> Strategy ${strategyId}`,
    );
    return { success: true, autoRenew };
  }

  async getMyStrategies(userId: string) {
    const defaultBroker = await findAnyActiveBroker(this.prisma, userId);
    if (defaultBroker) {
      await linkOrphanStrategySubscriptions(
        this.prisma,
        userId,
        defaultBroker.id,
      );
    }

    const subs = await this.prisma.userStrategySubscription.findMany({
      where: { userId, status: { not: SubscriptionStatus.INACTIVE } },
      orderBy: { subscribedAt: 'desc' },
      include: {
        brokerAccount: {
          select: {
            id: true,
            brokerName: true,
            accountNumberLast4: true,
            initialEquity: true,
            isPaperTrading: true,
          },
        },
        strategy: {
          include: {
            creator: { select: { fullName: true, username: true } },
          },
        },
      },
    });

    const strategyIds = subs.map((s) => s.strategyId);
    const trades =
      strategyIds.length === 0
        ? []
        : await this.prisma.trade.findMany({
            where: {
              userId,
              strategyId: { in: strategyIds },
              status: { in: [TradeStatus.OPEN, TradeStatus.CLOSED] },
            },
            select: {
              strategyId: true,
              profit: true,
              status: true,
            },
          });

    const pnlByStrategy = new Map<
      string,
      { net: number; wins: number; closed: number }
    >();
    for (const t of trades) {
      if (!t.strategyId) continue;
      const row = pnlByStrategy.get(t.strategyId) ?? {
        net: 0,
        wins: 0,
        closed: 0,
      };
      const profit = Number(t.profit ?? 0);
      if (Number.isFinite(profit)) row.net += profit;
      if (t.status === TradeStatus.CLOSED) {
        row.closed += 1;
        if (profit > 0) row.wins += 1;
      }
      pnlByStrategy.set(t.strategyId, row);
    }

    const autoRenewFlags = await Promise.all(
      subs.map((s) => this.redis.get(this.autoRenewKey(userId, s.strategyId))),
    );

    return subs.map((s, idx) => {
      const autoRenew = autoRenewFlags[idx] !== '0';
      const stats = pnlByStrategy.get(s.strategyId) ?? {
        net: 0,
        wins: 0,
        closed: 0,
      };
      const currentPnlUsd = Number(stats.net.toFixed(2));
      const equityBase = Number(s.brokerAccount?.initialEquity ?? 0);
      const currentPnlPct =
        equityBase > 0
          ? Number(((currentPnlUsd / equityBase) * 100).toFixed(2))
          : 0;
      const winRate =
        stats.closed > 0
          ? Number(((stats.wins / stats.closed) * 100).toFixed(1))
          : 0;
      const planType = s.planType ?? 'MONTHLY';
      const renewalDate = s.expiresAt ?? undefined;
      const brokerLabel = s.brokerAccount
        ? s.brokerAccount.accountNumberLast4
          ? `${s.brokerAccount.brokerName} ••${s.brokerAccount.accountNumberLast4}`
          : s.brokerAccount.brokerName
        : null;

      return {
        ...s.strategy,
        subscriptionId: s.id,
        status: s.status,
        planType,
        billingModel: s.billingModel,
        profitShareState: s.profitShareState,
        profitShareAccruedUnsettled: s.profitShareAccruedUnsettled,
        subscribedAt: s.subscribedAt,
        expiresAt: renewalDate,
        currentPnl: currentPnlUsd,
        currentPnlPct,
        pnlUnit: 'usd' as const,
        latestPnl: currentPnlUsd,
        brokerAccount: s.brokerAccount
          ? {
              id: s.brokerAccount.id,
              broker: s.brokerAccount.brokerName,
              accountName: brokerLabel,
              last4: s.brokerAccount.accountNumberLast4,
              isPaper: s.brokerAccount.isPaperTrading,
            }
          : null,
        monthlyFee: s.strategy.monthlyPrice ?? 0,
        renewsAt: renewalDate,
        nextBillingDate: renewalDate,
        autoRenew,
        latestPerformance: {
          winRate,
          totalReturn: currentPnlPct,
          netPnl: currentPnlUsd,
        },
        subscription: {
          id: s.id,
          status: s.status,
          planType,
          billingModel: s.billingModel,
          profitShareState: s.profitShareState,
          profitShareAccruedUnsettled: s.profitShareAccruedUnsettled,
          renewalDate,
          startedAt: s.subscribedAt,
          autoRenew,
          brokerAccount: brokerLabel,
        },
        botName: s.strategy.name,
        brokerName: s.brokerAccount?.brokerName ?? null,
        accountNumber: s.brokerAccount?.accountNumberLast4 ?? null,
        pnl: currentPnlUsd,
        performance: undefined,
      };
    });
  }

  private async assertTier(
    userId: string,
    required: string[],
    featureName: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true },
    });
    if (!user || !required.includes(user.subscriptionTier)) {
      throw new ForbiddenException(
        `${featureName} requires ${required.join(' or ')} subscription`,
      );
    }
  }

  async runBacktest(strategyId: string, userId: string, dto: RunBacktestDto) {
    await this.assertTier(
      userId,
      ['PRO', 'ELITE', 'BUSINESS', 'INSTITUTIONAL'],
      'Backtesting',
    );
    const strategy = await this.prisma.strategy.findUnique({
      where: { id: strategyId },
    });
    if (!strategy) throw new NotFoundException();

    return this.executeBacktest(
      dto.configOverride || strategy.configJson,
      dto,
      userId,
      strategyId,
    );
  }

  async runBacktestPreview(userId: string, dto: RunBacktestDto) {
    await this.assertTier(
      userId,
      ['PRO', 'ELITE', 'BUSINESS', 'INSTITUTIONAL'],
      'Backtesting',
    );
    if (!dto.configOverride) {
      throw new BadRequestException('Config override required for preview');
    }
    return this.executeBacktest(dto.configOverride, dto, userId, 'preview');
  }

  async runWalkForwardValidation(
    strategyId: string,
    userId: string,
    dto: WalkForwardValidationDto,
  ) {
    await this.assertTier(
      userId,
      ['ELITE', 'BUSINESS', 'INSTITUTIONAL'],
      'Walk-forward validation',
    );
    const strategy = await this.prisma.strategy.findUnique({
      where: { id: strategyId },
    });
    if (!strategy) throw new NotFoundException();

    const config = dto.configOverride || strategy.configJson;
    return this.executeWalkForwardValidation(config, dto, userId, strategyId);
  }

  async runSensitivityAnalysis(
    strategyId: string,
    userId: string,
    dto: SensitivityAnalysisDto,
  ) {
    await this.assertTier(
      userId,
      ['ELITE', 'BUSINESS', 'INSTITUTIONAL'],
      'Sensitivity analysis',
    );
    const strategy = await this.prisma.strategy.findUnique({
      where: { id: strategyId },
    });
    if (!strategy) throw new NotFoundException();

    const config = dto.configOverride || strategy.configJson;
    return this.executeSensitivityAnalysis(config, dto, userId, strategyId);
  }

  private async executeBacktest(
    config: any,
    dto: RunBacktestDto,
    userId: string,
    cacheId: string,
  ) {
    const cacheKey = `backtest:${cacheId}:${this.hashObject(dto)}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    if (
      !process.env.BACKTEST_SERVICE_URL ||
      process.env.BACKTEST_USE_LOCAL === 'true'
    ) {
      const result = await this.backtestSvc.runFromDefinition(
        config,
        dto.startDate,
        dto.endDate,
        dto.initialCapital ?? 10_000,
      );
      await this.redis.set(cacheKey, JSON.stringify(result), 3600);
      return result;
    }

    try {
      const response = await axios.post(
        `${process.env.BACKTEST_SERVICE_URL}/backtest/run`,
        {
          strategyConfig: config,
          params: {
            start_date: dto.startDate,
            end_date: dto.endDate,
            initial_capital: dto.initialCapital,
          },
          userId,
        },
        { timeout: 60000 },
      );
      await this.redis.set(cacheKey, JSON.stringify(response.data), 3600);
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNABORTED')
        throw new BadRequestException('Backtest timeout');
      throw new BadRequestException('Backtest service unavailable');
    }
  }

  private async executeWalkForwardValidation(
    config: any,
    dto: WalkForwardValidationDto,
    userId: string,
    cacheId: string,
  ) {
    const cacheKey = `walk-forward:${cacheId}:${this.hashObject(dto)}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const results: Array<any> = [];
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    const trainingWindowDays = Math.max(dto.trainingWindowDays ?? 90, 7);
    const testWindowDays = Math.max(dto.testWindowDays ?? 30, 1);
    const stepDays = Math.max(dto.stepDays ?? testWindowDays, 1);

    for (let cursor = new Date(start); cursor < end; ) {
      const trainingStart = new Date(cursor);
      const trainingEnd = this.addDays(trainingStart, trainingWindowDays);
      const testStart = new Date(trainingEnd);
      const testEnd = this.addDays(testStart, testWindowDays);

      if (testEnd > end) break;

      const baseValue = this.getNestedValue(
        config,
        dto.parameterPath ?? 'riskMultiplier',
      );
      const candidateValues = this.buildCandidateValues(
        baseValue,
        dto.perturbationPct ?? 10,
      );

      const trainRuns = await Promise.all(
        candidateValues.map(async (candidateValue) => {
          const candidateConfig = this.setNestedValue(
            this.clone(config ?? {}),
            dto.parameterPath ?? 'riskMultiplier',
            candidateValue,
          );
          const trainDto = {
            ...dto,
            startDate: trainingStart.toISOString(),
            endDate: trainingEnd.toISOString(),
          } as RunBacktestDto;
          const metrics = await this.executeBacktest(
            candidateConfig,
            trainDto,
            userId,
            `${cacheId}:wf-train:${trainingStart.toISOString()}`,
          );
          return {
            candidateValue,
            candidateConfig,
            metrics,
          };
        }),
      );

      trainRuns.sort((a, b) => {
        const scoreA = this.scoreMetrics(a.metrics);
        const scoreB = this.scoreMetrics(b.metrics);
        return scoreB - scoreA;
      });

      const selected = trainRuns[0];
      const testDto = {
        ...dto,
        startDate: testStart.toISOString(),
        endDate: testEnd.toISOString(),
      } as RunBacktestDto;
      const testMetrics = await this.executeBacktest(
        selected.candidateConfig,
        testDto,
        userId,
        `${cacheId}:wf-test:${testStart.toISOString()}`,
      );

      results.push({
        trainingWindow: {
          start: trainingStart.toISOString(),
          end: trainingEnd.toISOString(),
        },
        testWindow: {
          start: testStart.toISOString(),
          end: testEnd.toISOString(),
        },
        selectedParameterValue: selected.candidateValue,
        trainingMetrics: selected.metrics,
        testMetrics,
      });

      cursor = this.addDays(cursor, stepDays);
    }

    const summary = this.summarizeValidationResults(results);
    const payload = {
      mode: 'walk-forward',
      parameterPath: dto.parameterPath ?? 'riskMultiplier',
      results,
      summary,
    };

    await this.redis.set(cacheKey, JSON.stringify(payload), 3600);
    return payload;
  }

  private async executeSensitivityAnalysis(
    config: any,
    dto: SensitivityAnalysisDto,
    userId: string,
    cacheId: string,
  ) {
    const cacheKey = `sensitivity:${cacheId}:${this.hashObject(dto)}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const baseValue = this.getNestedValue(
      config,
      dto.parameterPath ?? 'riskMultiplier',
    );
    const candidateValues = this.buildCandidateValues(
      baseValue,
      dto.perturbationPct ?? 10,
      dto.sampleSize ?? 5,
    );

    const runs = await Promise.all(
      candidateValues.map(async (candidateValue) => {
        const candidateConfig = this.setNestedValue(
          this.clone(config ?? {}),
          dto.parameterPath ?? 'riskMultiplier',
          candidateValue,
        );
        const metrics = await this.executeBacktest(
          candidateConfig,
          dto,
          userId,
          `${cacheId}:sensitivity:${candidateValue}`,
        );
        return { candidateValue, metrics };
      }),
    );

    const baselineScore = this.scoreMetrics(
      runs.find((run) => run.candidateValue === baseValue)?.metrics ??
        runs[Math.floor(runs.length / 2)]?.metrics,
    );
    const bestScore = Math.max(
      ...runs.map((run) => this.scoreMetrics(run.metrics)),
    );
    const worstScore = Math.min(
      ...runs.map((run) => this.scoreMetrics(run.metrics)),
    );
    const resilienceScore = Math.max(
      0,
      Math.min(100, 100 - Math.abs(bestScore - worstScore) * 10),
    );

    const payload = {
      mode: 'sensitivity',
      parameterPath: dto.parameterPath ?? 'riskMultiplier',
      baselineValue: baseValue,
      resilienceScore: this.round(resilienceScore),
      baselineScore: this.round(baselineScore),
      runs,
    };

    await this.redis.set(cacheKey, JSON.stringify(payload), 3600);
    return payload;
  }

  async publish(id: string, userId: string) {
    const strategy = await this.prisma.strategy.findUnique({ where: { id } });
    if (!strategy || strategy.creatorId !== userId)
      throw new ForbiddenException();

    if (
      strategy.verificationStatus === VerificationStatus.VERIFIED &&
      strategy.isVerified
    ) {
      throw new BadRequestException(
        'Bot is already approved. Use Publish to marketplace instead.',
      );
    }

    const reviewStartedAt = new Date();
    const reviewEndsAt = new Date(
      reviewStartedAt.getTime() + 7 * 24 * 60 * 60 * 1000,
    );

    return this.prisma.strategy.update({
      where: { id },
      data: {
        isPublished: false,
        isVerified: false,
        verificationStatus: VerificationStatus.PENDING,
        reviewStartedAt,
        reviewEndsAt,
        reviewNotes:
          'Submitted for 1-week real-market review by Profytron team.',
      },
    });
  }

  async publishLive(id: string, userId: string) {
    const strategy = await this.prisma.strategy.findUnique({ where: { id } });
    if (!strategy || strategy.creatorId !== userId)
      throw new ForbiddenException();

    if (
      !strategy.isVerified ||
      strategy.verificationStatus !== VerificationStatus.VERIFIED
    ) {
      throw new BadRequestException(
        'Bot must be approved by Profytron before it can go live on the marketplace.',
      );
    }

    const monthlyPrice = strategy.monthlyPrice ?? 0;
    const annualPrice =
      strategy.annualPrice ?? Math.round(Number(monthlyPrice) * 10);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    await this.prisma.$transaction(async (tx) => {
      await tx.marketplaceListing.upsert({
        where: { strategyId: id },
        create: {
          strategyId: id,
          monthlyPrice,
          annualPrice,
          lifetimePrice: strategy.lifetimePrice ?? 0,
          trialDays: 7,
          maxCopies: strategy.maxCopies,
          isFeatured: false,
        },
        update: {
          monthlyPrice,
          annualPrice,
        },
      });

      await tx.strategy.update({
        where: { id },
        data: {
          isPublished: true,
          monthlyPrice,
          annualPrice,
        },
      });

      await tx.strategyDocument.updateMany({
        where: { strategyId: id },
        data: { isPublished: true },
      });

      await tx.strategyPerformance.upsert({
        where: { strategyId_date: { strategyId: id, date: today } },
        create: {
          strategyId: id,
          date: today,
          winRate: 0,
          drawdown: 0,
          maxDrawdown: 0,
          sharpeRatio: 0,
          sortinoRatio: 0,
          totalTrades: 0,
          winningTrades: 0,
          netPnl: 0,
          equityCurve: [],
        },
        update: {},
      });

      const creatorBroker = await tx.brokerAccount.findFirst({
        where: {
          userId,
          isActive: true,
          isPaperTrading: false,
          brokerName: { in: ['MT4', 'MT5'] },
        },
        orderBy: [{ isDefault: 'desc' }, { connectedAt: 'desc' }],
        select: { id: true },
      });

      await tx.userStrategySubscription.upsert({
        where: { userId_strategyId: { userId, strategyId: id } },
        create: {
          userId,
          strategyId: id,
          status: SubscriptionStatus.ACTIVE,
          planType: 'MONTHLY',
          brokerAccountId: creatorBroker?.id ?? null,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
        update: {
          status: SubscriptionStatus.ACTIVE,
          cancelledAt: null,
          ...(creatorBroker ? { brokerAccountId: creatorBroker.id } : {}),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });
    });

    await Promise.all([
      this.redis.del('cache:mkt:featured'),
      this.redis.delPrefix('cache:mkt:listings:'),
      this.redis.delPrefix('cache:strategies:'),
    ]);

    return this.prisma.strategy.findUnique({
      where: { id },
      include: {
        listing: true,
        creator: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });
  }

  private calculateMonthlyReturns(performance: any[]) {
    const returns: Record<string, number> = {};
    performance.forEach((p) => {
      const monthKey = p.date.toISOString().slice(0, 7);
      returns[monthKey] = (returns[monthKey] || 0) + p.netPnl;
    });
    return returns;
  }

  private summarizeValidationResults(results: Array<any>) {
    if (results.length === 0) {
      return {
        windows: 0,
        averageTestSharpe: 0,
        averageTestPnl: 0,
        averageTestWinRate: 0,
      };
    }

    const average = (values: number[]) =>
      values.reduce((sum, value) => sum + value, 0) / values.length;

    return {
      windows: results.length,
      averageTestSharpe: this.round(
        average(results.map((result) => this.scoreMetrics(result.testMetrics))),
      ),
      averageTestPnl: this.round(
        average(
          results.map((result) =>
            this.metricValue(result.testMetrics, 'total_pnl'),
          ),
        ),
      ),
      averageTestWinRate: this.round(
        average(
          results.map((result) =>
            this.metricValue(result.testMetrics, 'win_rate'),
          ),
        ),
      ),
    };
  }

  private metricValue(metrics: any, key: string) {
    const value = metrics?.metrics?.[key] ?? metrics?.[key] ?? 0;
    return Number(value) || 0;
  }

  private scoreMetrics(metrics: any) {
    const sharpe = this.metricValue(metrics, 'sharpe_ratio');
    const pnl = this.metricValue(metrics, 'total_pnl');
    const drawdown = Math.abs(this.metricValue(metrics, 'max_drawdown'));
    return sharpe * 10 + pnl / 1000 - drawdown / 10;
  }

  private buildCandidateValues(
    baseValue: any,
    perturbationPct: number,
    sampleSize = 5,
  ) {
    const numericBase = Number(baseValue);
    if (!Number.isFinite(numericBase)) {
      return [baseValue];
    }

    const center = Math.max(1, sampleSize);
    const step = perturbationPct / 100 / Math.max(center - 1, 1);
    const values = Array.from({ length: center }, (_, index) => {
      const offset = index - (center - 1) / 2;
      const multiplier = 1 + offset * step;
      return this.round(numericBase * multiplier, 6);
    });
    return [...new Set(values)];
  }

  private getNestedValue(obj: any, path: string) {
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
  }

  private setNestedValue(obj: any, path: string, value: any) {
    const clone = this.clone(obj);
    const keys = path.split('.');
    let cursor = clone;
    for (let index = 0; index < keys.length - 1; index += 1) {
      const key = keys[index];
      cursor[key] = cursor[key] ?? {};
      cursor = cursor[key];
    }
    cursor[keys[keys.length - 1]] = value;
    return clone;
  }

  private clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
  }

  private addDays(date: Date, days: number) {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
  }

  private round(value: number, precision = 2) {
    const multiplier = 10 ** precision;
    return Math.round(value * multiplier) / multiplier;
  }

  private hashObject(obj: any): string {
    return crypto.createHash('md5').update(JSON.stringify(obj)).digest('hex');
  }
}
