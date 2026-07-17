import { Controller, Get, Inject, Query, Req, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { REDIS_CLIENT } from '../auth/redis.service';
import Redis from 'ioredis';

type RangeKey = '1d' | '1w' | '1m' | '3m' | '1y' | 'all';

@ApiTags('Analytics')
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 429, description: 'Rate limit exceeded' })
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

  private async withCache<T>(
    key: string,
    ttlSeconds: number,
    producer: () => Promise<T>,
  ): Promise<T> {
    const cached = await this.redisClient.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }

    const fresh = await producer();
    await this.redisClient.set(key, JSON.stringify(fresh), 'EX', ttlSeconds);
    return fresh;
  }

  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get main portfolio performance metrics' })
  @Get('portfolio')
  async getPortfolio(@Req() req: any, @Query('range') range?: string) {
    const normalizedRange = this.normalizeRange(range);
    // getPortfolioStats caches itself in Redis under this exact same key with
    // a deliberate 2-minute TTL. Wrapping it in withCache(..., 30, ...) here
    // used to overwrite that TTL down to 30s on every write (SET always
    // resets expiry) — silently quadrupling recompute frequency and issuing
    // a redundant extra Redis round trip per request. Call the service
    // directly and let it own its own cache lifetime.
    return this.analyticsService.getPortfolioStats(req.user.id, normalizedRange);
  }

  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get monthly returns heatmap data' })
  @Get('monthly-returns')
  async getMonthlyReturns(@Req() req: any) {
    return this.withCache(`analytics:monthly-returns:${req.user.id}`, 300, () =>
      this.analyticsService.getMonthlyReturns(req.user.id),
    );
  }

  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get strategy level performance and correlation' })
  @Get('strategy-comparison')
  async getStrategyComparison(@Req() req: any, @Query('range') range?: string) {
    const normalizedRange = this.normalizeRange(range);
    // Already Redis-cached inside the service under this exact key/TTL —
    // avoid a redundant second cache layer (see getPortfolio for details).
    return this.analyticsService.getStrategyComparison(
      req.user.id,
      normalizedRange,
    );
  }

  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({
    summary: 'Get portfolio risk analytics and drawdown profile',
  })
  @Get('risk')
  async getRisk(@Req() req: any, @Query('range') range?: string) {
    const normalizedRange = this.normalizeRange(range);
    // Already Redis-cached inside the service under this exact key/TTL.
    return this.analyticsService.getRiskAnalytics(req.user.id, normalizedRange);
  }

  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({
    summary: 'Get trade distribution, duration, and symbol analytics',
  })
  @Get('trades')
  async getTrades(@Req() req: any, @Query('range') range?: string) {
    const normalizedRange = this.normalizeRange(range);
    // Already Redis-cached inside the service under this exact key/TTL.
    return this.analyticsService.getTradeAnalytics(req.user.id, normalizedRange);
  }

  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get trade rows for CSV export' })
  @Get('trades/export')
  async getTradesExport(@Req() req: any, @Query('range') range?: string) {
    const normalizedRange = this.normalizeRange(range);
    // Already Redis-cached inside the service (under a different key,
    // `analytics:trade-export:*`) — this outer layer was pure duplicate work.
    return this.analyticsService.getTradeExport(req.user.id, normalizedRange);
  }

  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get execution latency and slippage metrics' })
  @Get('execution')
  async getExecutionMetrics(@Req() req: any, @Query('range') range?: string) {
    const normalizedRange = this.normalizeRange(range);
    // Already Redis-cached inside the service (under a different key,
    // `analytics:execution-metrics:*`) — this outer layer was pure duplicate work.
    return this.analyticsService.getExecutionMetrics(req.user.id, normalizedRange);
  }

  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get tax-ready trading and wallet report' })
  @Get('tax-report')
  async getTaxReport(@Req() req: any, @Query('year') year?: string) {
    const parsedYear = Number(year ?? new Date().getUTCFullYear());
    const safeYear = Number.isFinite(parsedYear)
      ? Math.min(Math.max(parsedYear, 2000), 2100)
      : new Date().getUTCFullYear();
    return this.withCache(
      `analytics:tax-report:${req.user.id}:${safeYear}`,
      600,
      () => this.analyticsService.getTaxReport(req.user.id, safeYear),
    );
  }

  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({
    summary: 'Get global intelligence snapshot and macro insights',
  })
  @Get('global')
  async getGlobal(@Req() req: any) {
    return this.withCache(`analytics:global:${req.user.id}`, 300, () =>
      this.analyticsService.getGlobalIntelligence(),
    );
  }

  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get platform leaderboard' })
  @Get('leaderboard')
  async getLeaderboard(@Query('limit') limit?: string) {
    const parsedLimit = Number(limit ?? 10);
    const safeLimit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 3), 50)
      : 10;
    // getLeaderboard caches itself under the exact same key
    // (`analytics:leaderboard:{limit}`) with a 2-minute TTL — wrapping it here
    // used to clobber that TTL down to 60s on every write (see getPortfolio).
    return this.analyticsService.getLeaderboard(safeLimit);
  }
}
