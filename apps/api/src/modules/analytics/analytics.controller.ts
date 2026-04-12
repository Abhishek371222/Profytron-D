import { Controller, Get, Inject, Query, Req, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { REDIS_CLIENT } from '../auth/redis.service';
import Redis from 'ioredis';

type RangeKey = '1d' | '1w' | '1m' | '3m' | '1y' | 'all';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
  ) {}

  private normalizeRange(range?: string): RangeKey {
    const normalized = (range ?? '1m').toLowerCase();
    const valid = new Set<RangeKey>(['1d', '1w', '1m', '3m', '1y', 'all']);
    if (valid.has(normalized as RangeKey)) {
      return normalized as RangeKey;
    }
    return '1m';
  }

  private async withCache<T>(key: string, ttlSeconds: number, producer: () => Promise<T>): Promise<T> {
    const cached = await this.redisClient.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }

    const fresh = await producer();
    await this.redisClient.set(key, JSON.stringify(fresh), 'EX', ttlSeconds);
    return fresh;
  }

  @ApiOperation({ summary: 'Get main portfolio performance metrics' })
  @Get('portfolio')
  async getPortfolio(@Req() req: any, @Query('range') range?: string) {
    const normalizedRange = this.normalizeRange(range);
    return this.withCache(
      `analytics:portfolio:${req.user.id}:${normalizedRange}`,
      30,
      () => this.analyticsService.getPortfolioStats(req.user.id, normalizedRange),
    );
  }

  @ApiOperation({ summary: 'Get monthly returns heatmap data' })
  @Get('monthly-returns')
  async getMonthlyReturns(@Req() req: any) {
    return this.withCache(
      `analytics:monthly-returns:${req.user.id}`,
      300,
      () => this.analyticsService.getMonthlyReturns(req.user.id),
    );
  }

  @ApiOperation({ summary: 'Get strategy level performance and correlation' })
  @Get('strategy-comparison')
  async getStrategyComparison(@Req() req: any, @Query('range') range?: string) {
    const normalizedRange = this.normalizeRange(range);
    return this.withCache(
      `analytics:strategy-comparison:${req.user.id}:${normalizedRange}`,
      120,
      () => this.analyticsService.getStrategyComparison(req.user.id, normalizedRange),
    );
  }

  @ApiOperation({ summary: 'Get portfolio risk analytics and drawdown profile' })
  @Get('risk')
  async getRisk(@Req() req: any, @Query('range') range?: string) {
    const normalizedRange = this.normalizeRange(range);
    return this.withCache(
      `analytics:risk:${req.user.id}:${normalizedRange}`,
      120,
      () => this.analyticsService.getRiskAnalytics(req.user.id, normalizedRange),
    );
  }

  @ApiOperation({ summary: 'Get trade distribution, duration, and symbol analytics' })
  @Get('trades')
  async getTrades(@Req() req: any, @Query('range') range?: string) {
    const normalizedRange = this.normalizeRange(range);
    return this.withCache(
      `analytics:trades:${req.user.id}:${normalizedRange}`,
      120,
      () => this.analyticsService.getTradeAnalytics(req.user.id, normalizedRange),
    );
  }

  @ApiOperation({ summary: 'Get global intelligence snapshot and macro insights' })
  @Get('global')
  async getGlobal(@Req() req: any) {
    return this.withCache(
      `analytics:global:${req.user.id}`,
      300,
      () => this.analyticsService.getGlobalIntelligence(),
    );
  }

  @ApiOperation({ summary: 'Get platform leaderboard' })
  @Get('leaderboard')
  async getLeaderboard(@Query('limit') limit?: string) {
    const parsedLimit = Number(limit ?? 10);
    const safeLimit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 3), 50) : 10;
    return this.withCache(
      `analytics:leaderboard:${safeLimit}`,
      60,
      () => this.analyticsService.getLeaderboard(safeLimit),
    );
  }
}
