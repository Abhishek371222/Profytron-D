import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './modules/auth/redis.service';
import { Public } from './modules/auth/guards/auth.guard';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  @Public()
  @Get()
  getStatus() {
    return { status: 'ok', version: '1.0.0', prefix: 'v1' };
  }

  @Public()
  @Get('health')
  async getHealth(@Res({ passthrough: true }) res: Response) {
    const [databaseResult, redisResult] = await Promise.allSettled([
      this.prismaService.$queryRaw`SELECT 1 AS ok`,
      this.redisService.ping(),
    ]);

    const database =
      databaseResult.status === 'fulfilled' ? 'connected' : 'degraded';
    const redis =
      redisResult.status === 'fulfilled' && redisResult.value
        ? 'connected'
        : 'degraded';

    if (database !== 'connected') {
      res.status(503);
    }

    return {
      status: database === 'connected' ? 'ok' : 'degraded',
      database,
      redis,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? 'unknown',
    };
  }
}
