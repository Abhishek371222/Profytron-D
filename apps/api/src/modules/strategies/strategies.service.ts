import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../auth/redis.service';
import {
  CreateStrategyDto,
  UpdateStrategyDto,
  StrategiesQueryDto,
  ActivateStrategyDto,
  RunBacktestDto,
} from './dto/strategy.dto';
import {
  Strategy,
  UserRole,
  SubscriptionStatus,
  VerificationStatus,
} from '@prisma/client';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class StrategiesService {
  private readonly logger = new Logger(StrategiesService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async findAll(query: StrategiesQueryDto, userId?: string) {
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

    let strategies: Array<
      Strategy & {
        creator: { id: string; fullName: string; avatarUrl: string | null };
        performance: any[];
        subscriptions?: any[];
      }
    > = [];
    let total = 0;

    if (performanceSortFields.has(requestedSortBy)) {
      const allStrategies = await this.prisma.strategy.findMany({
        where,
        include: {
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
        orderBy: { createdAt: 'desc' },
      });

      const sorted = allStrategies.sort((a, b) => {
        const aMetric = Number(
          (a.performance[0] as Record<string, unknown> | undefined)?.[
            requestedSortBy
          ] ?? 0,
        );
        const bMetric = Number(
          (b.performance[0] as Record<string, unknown> | undefined)?.[
            requestedSortBy
          ] ?? 0,
        );
        return requestedOrder === 'asc' ? aMetric - bMetric : bMetric - aMetric;
      });

      total = sorted.length;
      strategies = sorted.slice(skip, skip + limit);
    } else {
      const sortField = scalarSortFields.has(requestedSortBy)
        ? requestedSortBy
        : 'createdAt';

      const [pagedStrategies, count] = await Promise.all([
        this.prisma.strategy.findMany({
          where,
          include: {
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

    return {
      strategies: strategies.map((s) => ({
        ...s,
        isSubscribed: (s.subscriptions?.length ?? 0) > 0,
        latestPerformance: s.performance[0] || null,
        performance: undefined, // Hide performance array in summary
        subscriptions: undefined,
      })),
      total,
      page,
      limit,
    };
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

    // Calculate Monthly Returns
    const monthlyReturns = this.calculateMonthlyReturns(strategy.performance);

    // Format Equity Curve (Last 365 Days)
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
    // Validate role/tier (Simplified for now)
    const user = await this.prisma.user.findUnique({
      where: { id: creatorId },
    });
    if (!user) throw new NotFoundException('User identity not found');

    if (user.role === UserRole.USER && user.subscriptionTier === 'FREE') {
      throw new ForbiddenException(
        'Upgrade to PRO for Strategy Deployment Handshake',
      );
    }

    return this.prisma.strategy.create({
      data: {
        ...dto,
        creatorId,
        configJson: dto.configJson || {},
      },
    });
  }

  async update(id: string, userId: string, dto: UpdateStrategyDto) {
    const strategy = await this.prisma.strategy.findUnique({ where: { id } });
    if (!strategy || strategy.creatorId !== userId) {
      throw new ForbiddenException('Not your strategy');
    }

    const data: any = { ...dto };

    // If config changes and it was verified, drop verification
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
    });
    if (!strategy || !strategy.isPublished)
      throw new NotFoundException('Strategy not available');

    // Check if already active
    const existing = await this.prisma.userStrategySubscription.findUnique({
      where: { userId_strategyId: { userId, strategyId } },
    });

    if (existing && existing.status === SubscriptionStatus.ACTIVE) {
      return this.prisma.userStrategySubscription.update({
        where: { id: existing.id },
        data: {
          brokerAccountId: dto.brokerAccountId,
        },
      });
    }

    const sub = await this.prisma.userStrategySubscription.upsert({
      where: { userId_strategyId: { userId, strategyId } },
      create: {
        userId,
        strategyId,
        brokerAccountId: dto.brokerAccountId,
        status: SubscriptionStatus.ACTIVE,
      },
      update: {
        status: SubscriptionStatus.ACTIVE,
        brokerAccountId: dto.brokerAccountId,
        subscribedAt: new Date(),
      },
    });

    this.logger.log(
      `STRATEGY_ACTIVATED: User ${userId} -> Strategy ${strategyId}`,
    );
    return sub;
  }

  async deactivate(strategyId: string, userId: string) {
    await this.prisma.userStrategySubscription.update({
      where: { userId_strategyId: { userId, strategyId } },
      data: { status: SubscriptionStatus.CANCELLED, cancelledAt: new Date() },
    });

    this.logger.log(
      `STRATEGY_DEACTIVATED: User ${userId} -> Strategy ${strategyId}`,
    );
    return { success: true };
  }

  async getMyStrategies(userId: string) {
    const subs = await this.prisma.userStrategySubscription.findMany({
      where: { userId, status: SubscriptionStatus.ACTIVE },
      include: {
        strategy: {
          include: {
            creator: { select: { fullName: true } },
            performance: { take: 1, orderBy: { date: 'desc' } },
          },
        },
      },
    });

    return subs.map((s) => ({
      ...s.strategy,
      subscriptionId: s.id,
      subscribedAt: s.subscribedAt,
      latestPnl: s.strategy.performance[0]?.netPnl || 0,
      performance: undefined,
    }));
  }

  async runBacktest(strategyId: string, userId: string, dto: RunBacktestDto) {
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
    if (!dto.configOverride) {
      throw new BadRequestException('Config override required for preview');
    }
    return this.executeBacktest(dto.configOverride, dto, userId, 'preview');
  }

  private async executeBacktest(
    config: any,
    dto: RunBacktestDto,
    userId: string,
    cacheId: string,
  ) {
    // Cache key based on config and params
    const cacheKey = `backtest:${cacheId}:${this.hashObject(dto)}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

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

      await this.redis.set(cacheKey, JSON.stringify(response.data), 3600); // 1h cache
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNABORTED')
        throw new BadRequestException('Backtest timeout');
      throw new BadRequestException('Backtest service unavailable');
    }
  }

  async publish(id: string, userId: string) {
    const strategy = await this.prisma.strategy.findUnique({ where: { id } });
    if (!strategy || strategy.creatorId !== userId)
      throw new ForbiddenException();

    return this.prisma.strategy.update({
      where: { id },
      data: {
        isPublished: true,
        verificationStatus: VerificationStatus.PENDING,
      },
    });
  }

  private calculateMonthlyReturns(performance: any[]) {
    const returns: Record<string, number> = {};
    performance.forEach((p) => {
      const monthKey = p.date.toISOString().slice(0, 7); // YYYY-MM
      returns[monthKey] = (returns[monthKey] || 0) + p.netPnl;
    });
    return returns;
  }

  private hashObject(obj: any): string {
    return crypto.createHash('md5').update(JSON.stringify(obj)).digest('hex');
  }
}
