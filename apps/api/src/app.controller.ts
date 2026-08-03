import { Controller, Get, Header, Res } from '@nestjs/common';
import type { Response } from 'express';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './modules/auth/redis.service';
import { TradingGateway } from './modules/trading/trading.gateway';
import { Public } from './modules/auth/guards/auth.guard';
import { MetricsService } from './common/metrics/metrics.service';

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('health probe timeout')), ms),
    ),
  ]);
}

@Controller()
export class AppController {
  private healthCache: {
    at: number;
    statusCode: number;
    body: Record<string, unknown>;
  } | null = null;
  private static readonly HEALTH_CACHE_TTL_MS = 2000;

  constructor(
    private readonly appService: AppService,
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
    private readonly tradingGateway: TradingGateway,
    private readonly metricsService: MetricsService,
    @InjectQueue('trade_execution') private readonly tradeQueue: Queue,
  ) {}

  @Public()
  @Get()
  getStatus() {
    const executionMode = (
      process.env.EXECUTION_MODE || 'master_only'
    ).toLowerCase();
    const isCopyFactory = executionMode === 'copyfactory';
    return {
      status: 'ok',
      version: '1.0.4',
      prefix: 'v1',
      executionMode: isCopyFactory ? 'copyfactory' : 'master_only',
      copyFactoryEnabled: process.env.COPYFACTORY_ENABLED === 'true',
      allowMetaApiSubscribers: process.env.ALLOW_METAAPI_SUBSCRIBERS === 'true',
      metaApiUserSeats: true,
      storeOnlyUserConnect: false,
      gitSha:
        process.env.GIT_COMMIT?.slice(0, 7) ??
        process.env.RENDER_GIT_COMMIT?.slice(0, 7) ??
        null,
    };
  }

  @Public()
  @Get('live')
  getLive() {
    return {
      status: this.metricsService.isShuttingDown() ? 'shutting_down' : 'ok',
      check: 'live',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      gitSha:
        process.env.GIT_COMMIT?.slice(0, 7) ??
        process.env.RENDER_GIT_COMMIT?.slice(0, 7) ??
        null,
      version: process.env.npm_package_version ?? 'unknown',
    };
  }

  @Public()
  @Get('ready')
  async getReady(@Res({ passthrough: true }) res: Response) {
    if (this.metricsService.isShuttingDown()) {
      res.status(503);
      return {
        status: 'not_ready',
        check: 'ready',
        reason: 'shutting_down',
        timestamp: new Date().toISOString(),
      };
    }

    const readyTimeoutMs =
      process.env.NODE_ENV === 'production'
        ? 500
        : Number(process.env.READY_PROBE_TIMEOUT_MS) > 0
          ? Number(process.env.READY_PROBE_TIMEOUT_MS)
          : 2000;
    try {
      await withTimeout(
        this.prismaService.$queryRaw`SELECT 1 AS ok`,
        readyTimeoutMs,
      );

      let redis: 'ok' | 'skipped' | 'unavailable' = 'skipped';
      if (process.env.READY_REQUIRE_REDIS === 'true') {
        try {
          await withTimeout(this.redisService.ping(), readyTimeoutMs);
          redis = 'ok';
        } catch {
          res.status(503);
          return {
            status: 'not_ready',
            check: 'ready',
            database: 'connected',
            redis: 'unavailable',
            timestamp: new Date().toISOString(),
          };
        }
      }

      return {
        status: 'ok',
        check: 'ready',
        database: 'connected',
        redis,
        timestamp: new Date().toISOString(),
      };
    } catch {
      res.status(503);
      return {
        status: 'not_ready',
        check: 'ready',
        database: 'unavailable',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Public()
  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  getMetrics(@Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'no-store');
    return this.metricsService.toPrometheus();
  }

  @Public()
  @Get('health')
  async getHealth(@Res({ passthrough: true }) res: Response) {
    const cached = this.healthCache;
    if (cached && Date.now() - cached.at < AppController.HEALTH_CACHE_TTL_MS) {
      if (cached.statusCode !== 200) res.status(cached.statusCode);
      return cached.body;
    }

    const [databaseResult, redisResult, queueResult] = await Promise.allSettled(
      [
        withTimeout(this.prismaService.$queryRaw`SELECT 1 AS ok`, 500),
        withTimeout(this.redisService.ping(), 300),
        withTimeout(this.tradeQueue.client.ping(), 300),
      ],
    );

    const database =
      databaseResult.status === 'fulfilled' ? 'connected' : 'unavailable';
    const redis =
      redisResult.status === 'fulfilled' && redisResult.value
        ? 'connected'
        : 'degraded';
    const queue =
      queueResult.status === 'fulfilled' && queueResult.value === 'PONG'
        ? 'healthy'
        : 'degraded';
    const websocket = this.tradingGateway?.server ? 'healthy' : 'degraded';

    const metaApiConfigured = Boolean(
      (process.env.METAAPI_TOKEN || '').trim().length > 10,
    );
    const metaApi = metaApiConfigured ? 'configured' : 'not_configured';

    const criticalDown =
      database !== 'connected' || this.metricsService.isShuttingDown();
    const anyDegraded =
      redis !== 'connected' || queue !== 'healthy' || websocket !== 'healthy';

    const status = criticalDown ? 'unhealthy' : anyDegraded ? 'degraded' : 'ok';
    const statusCode = criticalDown ? 503 : 200;
    if (statusCode !== 200) {
      res.status(statusCode);
    }

    const body = {
      status,
      check: 'health',
      database,
      redis,
      queue,
      websocket,
      metaApi,
      shuttingDown: this.metricsService.isShuttingDown(),
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? 'unknown',
      gitSha:
        process.env.GIT_COMMIT?.slice(0, 7) ??
        process.env.RENDER_GIT_COMMIT?.slice(0, 7) ??
        null,
    };
    this.healthCache = { at: Date.now(), statusCode, body };
    return body;
  }
}
