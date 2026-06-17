import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { RedisModule } from '../auth/redis.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [RedisModule, WalletModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
