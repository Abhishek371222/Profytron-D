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
  WalkForwardValidationDto,
  SensitivityAnalysisDto,
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

  async runWalkForwardValidation(
    strategyId: string,
    userId: string,
    dto: WalkForwardValidationDto,
  ) {
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
