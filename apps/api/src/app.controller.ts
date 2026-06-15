import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './modules/auth/redis.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  @Get()
  getStatus() {
    return { status: 'ok', version: '1.0.0', prefix: 'v1' };
  }

  @Get('health')
  async getHealth() {
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

    return {
      status: database === 'connected' ? 'ok' : 'degraded',
      database,
      redis,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? 'unknown',
    };
  }
}
