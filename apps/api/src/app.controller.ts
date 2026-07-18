import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './modules/auth/redis.service';
import { TradingGateway } from './modules/trading/trading.gateway';
import { Public } from './modules/auth/guards/auth.guard';

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
  /** Short-lived health snapshot to avoid repeated ~300ms probe RTT (API Phase 2). */
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
      gitSha: process.env.RENDER_GIT_COMMIT?.slice(0, 7) ?? null,
    };
  }

  @Public()
  @Get('live')
  /** Liveness — process is up. Never depends on DB/Redis. */
  getLive() {
    return {
      status: 'ok',
      check: 'live',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      gitSha: process.env.RENDER_GIT_COMMIT?.slice(0, 7) ?? null,
      version: process.env.npm_package_version ?? 'unknown',
    };
  }

  @Public()
  @Get('ready')
  /** Readiness — safe to receive traffic only if database is connected. */
  async getReady(@Res({ passthrough: true }) res: Response) {
    try {
      await withTimeout(this.prismaService.$queryRaw`SELECT 1 AS ok`, 500);
      return {
        status: 'ok',
        check: 'ready',
        database: 'connected',
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
  @Get('health')
  async getHealth(@Res({ passthrough: true }) res: Response) {
    const cached = this.healthCache;
    if (
      cached &&
      Date.now() - cached.at < AppController.HEALTH_CACHE_TTL_MS
    ) {
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

    // MetaAPI: configuration presence only — never hard-fail health on vendor outage.
    const metaApiConfigured = Boolean(
      (process.env.METAAPI_TOKEN || '').trim().length > 10,
    );
    const metaApi = metaApiConfigured ? 'configured' : 'not_configured';

    const criticalDown = database !== 'connected';
    const anyDegraded =
      redis !== 'connected' || queue !== 'healthy' || websocket !== 'healthy';

    const status = criticalDown
      ? 'unhealthy'
      : anyDegraded
        ? 'degraded'
        : 'ok';
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
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? 'unknown',
      gitSha: process.env.RENDER_GIT_COMMIT?.slice(0, 7) ?? null,
    };
    this.healthCache = { at: Date.now(), statusCode, body };
    return body;
  }
}
