import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TradingService } from './trading.service';
import { TradingController } from './trading.controller';
import { TradingGateway } from './trading.gateway';
import { TradeProcessor } from './trade.processor';
import { AuthModule } from '../auth/auth.module';
import { SubscriptionCleanupService } from './subscription-cleanup.service';

@Module({
  imports: [
    AuthModule,
    BullModule.registerQueue({
      name: 'trade_execution',
    }),
  ],
  controllers: [TradingController],
  providers: [
    TradingService,
    TradingGateway,
    TradeProcessor,
    SubscriptionCleanupService,
  ],
  exports: [
    TradingService,
    TradingGateway,
    TradeProcessor,
    SubscriptionCleanupService,
  ],
})
export class TradingModule {}
