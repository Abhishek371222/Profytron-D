import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule } from '@nestjs/throttler';
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
import { getRedisConnectionUrl } from './config/redis.config';
import { ScheduleModule } from '@nestjs/schedule';
import { SocialModule } from './modules/social/social.module';
import { SupportModule } from './modules/support/support.module';
import { StrategyBuilderModule } from './modules/strategy-builder/strategy-builder.module';
import { AiRiskModule } from './modules/ai-risk/ai-risk.module';
import { VpsModule } from './modules/vps/vps.module';
import { PreferencesModule } from './modules/preferences/preferences.module';
import { JournalModule } from './modules/journal/journal.module';
import { TelegramModule } from './modules/telegram/telegram.module';
import { BrokerIntegrationModule } from './modules/broker/broker-integration.module';

const parseRedisConfig = () => {
  const redisUrl = getRedisConnectionUrl();

  if (redisUrl) {
    try {
      const parsed = new URL(redisUrl);
      return {
        host: parsed.hostname,
        port: Number(parsed.port || 6379),
        username: parsed.username || 'default',
        password: decodeURIComponent(
          parsed.password || process.env.REDIS_PASSWORD || '',
        ),
        tls: parsed.protocol === 'rediss:' ? {} : undefined,
      };
    } catch {
      // Fall back to host/port configuration when URL parsing fails.
    }
  }

  return {
    host: process.env.REDIS_HOST || 'redis',
    port: Number(process.env.REDIS_PORT) || 6379,
    username: 'default',
    password: process.env.REDIS_PASSWORD,
    tls: Number(process.env.REDIS_PORT) === 443 ? {} : undefined,
  };
};

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'test'
          ? ['.env.test']
          : ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    BullModule.forRoot({
      redis: parseRedisConfig(),
    }),
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
    AiRiskModule,
    VpsModule,
    PreferencesModule,
    JournalModule,
    TelegramModule,
    BrokerIntegrationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: AppThrottlerGuard },
  ],
})
export class AppModule {}
