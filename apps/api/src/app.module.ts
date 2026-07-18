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
import { CoachModule } from './modules/coach/coach.module';
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
import { TutorialModule } from './modules/tutorial/tutorial.module';
import { PlansModule } from './modules/plans/plans.module';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { JwtAuthGuard } from './modules/auth/guards/auth.guard';

const API_ENV_FILE = join(__dirname, '..', '..', '.env');
const API_ENV_LOCAL_FILE = join(__dirname, '..', '..', '.env.local');

const parseRedisConfig = () => {
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
        ...(password
          ? { username: parsed.username || 'default', password }
          : {}),
        tls: parsed.protocol === 'rediss:' ? {} : undefined,
      };
    } catch {
      /* ignore */
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
              API_ENV_LOCAL_FILE,
              API_ENV_FILE,
              '/etc/secrets/.env',
              '/etc/secrets/render.env',
              '.env.local',
              '.env',
              'render.env',
            ],
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 100 }],
    }),
    BullModule.forRoot({ redis: parseRedisConfig() }),
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
    CoachModule,
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
    TutorialModule,
    PlansModule,
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
