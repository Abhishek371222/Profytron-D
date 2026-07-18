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
  @Get('health')
  async getHealth(@Res({ passthrough: true }) res: Response) {
    const [databaseResult, redisResult, queueResult] = await Promise.allSettled(
      [
        withTimeout(this.prismaService.$queryRaw`SELECT 1 AS ok`, 2000),
        withTimeout(this.redisService.ping(), 1500),
        withTimeout(this.tradeQueue.client.ping(), 1500),
      ],
    );

    const database =
      databaseResult.status === 'fulfilled' ? 'connected' : 'degraded';
    const redis =
      redisResult.status === 'fulfilled' && redisResult.value
        ? 'connected'
        : 'degraded';
    const queue =
      queueResult.status === 'fulfilled' && queueResult.value === 'PONG'
        ? 'healthy'
        : 'degraded';
    const websocket = this.tradingGateway?.server ? 'healthy' : 'degraded';

    if (database !== 'connected') {
      res.status(503);
    }

    return {
      status: database === 'connected' ? 'ok' : 'degraded',
      database,
      redis,
      queue,
      websocket,
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? 'unknown',
    };
  }
}
