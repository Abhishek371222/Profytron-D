import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule } from '@nestjs/throttler';
import { join } from 'path';
import { AppThrottlerGuard } from './common/guards/throttler.guard';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { StrategiesModule } from './modules/strategies/strategies.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { AdminModule } from './modules/admin/admin.module';
import { BrokerModule } from './modules/broker/broker.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { UsersModule } from './modules/users/users.module';
import { AffiliatesModule } from './modules/affiliates/affiliates.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { AIModule } from './modules/ai/ai.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { WebsocketModule } from './modules/websocket/websocket.module';
import { SearchModule } from './modules/search/search.module';
import { TradingModule } from './modules/trading/trading.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MarketModule } from './modules/market/market.module';
import { LeaderboardModule } from './modules/leaderboard/leaderboard.module';
import { getRedisConnectionUrl, isInMemoryRedis } from './config/redis.config';
import { ScheduleModule } from '@nestjs/schedule';
import { SocialModule } from './modules/social/social.module';
import { SupportModule } from './modules/support/support.module';
import { StrategyBuilderModule } from './modules/strategy-builder/strategy-builder.module';
import { BacktestModule } from './modules/backtest/backtest.module';
import { AiRiskModule } from './modules/ai-risk/ai-risk.module';
import { VpsModule } from './modules/vps/vps.module';
import { GrowthModule } from './modules/growth/growth.module';
import { AgentsModule } from './modules/agents/agents.module';
import { PreferencesModule } from './modules/preferences/preferences.module';
import { JournalModule } from './modules/journal/journal.module';
import { TelegramModule } from './modules/telegram/telegram.module';
import { BrokerIntegrationModule } from './modules/broker/broker-integration.module';
import { FeatureFlagsModule } from './modules/feature-flags/feature-flags.module';
import { ApiKeysModule } from './modules/api-keys/api-keys.module';
import { CopyModule } from './modules/copy/copy.module';
import { CopyBridgeModule } from './modules/copy-bridge/copy-bridge.module';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { JwtAuthGuard } from './modules/auth/guards/auth.guard';

/** Always resolve apps/api/.env regardless of process cwd (pnpm filter / nest watch). */
const API_ENV_FILE = join(__dirname, '..', '..', '.env');
const API_ENV_LOCAL_FILE = join(__dirname, '..', '..', '.env.local');

const parseRedisConfig = () => {
  // Dev without a real Redis server: point BullMQ at a local (unreachable)
  // Redis. ioredis emits handled connection errors and retries with backoff;
  // queue jobs won't process, but the API boots and all read/write HTTP flows
  // work. (The auth/cache client uses an in-memory mock — see redis.config.ts.)
  if (isInMemoryRedis()) {
    return {
      host: '127.0.0.1',
      port: 6379,
      maxRetriesPerRequest: null,
      retryStrategy: () => 30000,
    };
  }

  const redisUrl = getRedisConnectionUrl();

  if (redisUrl) {
    try {
      const parsed = new URL(redisUrl);
      const password = decodeURIComponent(
        parsed.password || process.env.REDIS_PASSWORD || '',
      );
      return {
        host: parsed.hostname,
        port: Number(parsed.port || 6379),
        // Only include auth when a password is present; Redis 5 (single-arg AUTH)
        // rejects connections that send both username + password.
        ...(password
          ? { username: parsed.username || 'default', password }
          : {}),
        tls: parsed.protocol === 'rediss:' ? {} : undefined,
      };
    } catch {
      // Fall back to host/port configuration when URL parsing fails.
    }
  }

  const password = process.env.REDIS_PASSWORD || '';
  return {
    host: process.env.REDIS_HOST || 'redis',
    port: Number(process.env.REDIS_PORT) || 6379,
    ...(password ? { username: 'default', password } : {}),
  };
};

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'test'
          ? ['.env.test']
          : [
              // Absolute paths first so cwd (repo root vs apps/api) never matters
              API_ENV_LOCAL_FILE,
              API_ENV_FILE,
              // Render Secret Files (filename must match upload)
              '/etc/secrets/.env',
              '/etc/secrets/render.env',
              '.env.local',
              '.env',
              'render.env',
            ],
    }),
    // Base limit = anonymous (100 req/min). Authenticated callers are bumped to
    // 1000 req/min in AppThrottlerGuard.
    // Use in-process memory storage — Redis throttler storage burns Upstash
    // command quota on every request (free tier 500k/mo). Auth/Bull still use Redis.
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 100 }],
    }),
    BullModule.forRoot({ redis: parseRedisConfig() }),
    // Registered here so the health controller can probe queue connectivity.
    BullModule.registerQueue({ name: 'trade_execution' }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    StrategiesModule,
    WalletModule,
    WebsocketModule,
    AdminModule,
    BrokerModule,
    NotificationsModule,
    AffiliatesModule,
    AnalyticsModule,
    MarketplaceModule,
    PaymentsModule,
    TradingModule,
    AIModule,
    SearchModule,
    MarketModule,
    LeaderboardModule,
    SocialModule,
    SupportModule,
    StrategyBuilderModule,
    BacktestModule,
    AiRiskModule,
    VpsModule,
    GrowthModule,
    AgentsModule,
    PreferencesModule,
    JournalModule,
    TelegramModule,
    BrokerIntegrationModule,
    FeatureFlagsModule,
    ApiKeysModule,
    CopyModule,
    CopyBridgeModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: AppThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
