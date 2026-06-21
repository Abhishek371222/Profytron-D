import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './modules/auth/redis.service';
import { TradingGateway } from './modules/trading/trading.gateway';
import { Public } from './modules/auth/guards/auth.guard';

/**
 * Resolve `promise` but never hang the health check: a stalled dependency
 * (e.g. an unreachable Redis still retrying its connection) rejects after
 * `ms` so the probe reports "degraded" instead of timing out the request.
 */
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
    return { status: 'ok', version: '1.0.0', prefix: 'v1' };
  }

  @Public()
  @Get('health')
  async getHealth(@Res({ passthrough: true }) res: Response) {
    const [databaseResult, redisResult, queueResult] =
      await Promise.allSettled([
        withTimeout(this.prismaService.$queryRaw`SELECT 1 AS ok`, 2000),
        withTimeout(this.redisService.ping(), 1500),
        withTimeout(this.tradeQueue.client.ping(), 1500),
      ]);

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
    // socket.io server is attached to the gateway once the HTTP server starts
    // listening; its presence means the WebSocket transport is accepting clients.
    const websocket = this.tradingGateway?.server ? 'healthy' : 'degraded';

    // Database is the only hard dependency: without it the API cannot serve
    // meaningful traffic, so we return 503 to keep it out of the load balancer.
    // Redis/queue/WebSocket degrade gracefully and stay in rotation.
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
