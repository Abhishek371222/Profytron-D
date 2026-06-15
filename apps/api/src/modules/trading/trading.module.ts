import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TradingService } from './trading.service';
import { TradingController } from './trading.controller';
import { TradingGateway } from './trading.gateway';
import { TradeProcessor } from './trade.processor';
import { AuthModule } from '../auth/auth.module';
import { SubscriptionCleanupService } from './subscription-cleanup.service';
import { MasterSyncService } from './master-sync.service';
import { CopyFactoryModule } from '../copy-factory/copy-factory.module';
import { GrowthModule } from '../growth/growth.module';
import { MarketModule } from '../market/market.module';
import { MarketPriceBroadcastService } from './market-price-broadcast.service';

@Module({
  imports: [
    AuthModule,
    CopyFactoryModule,
    GrowthModule,
    MarketModule,
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
    MasterSyncService,
    MarketPriceBroadcastService,
  ],
  exports: [
    TradingService,
    TradingGateway,
    TradeProcessor,
    SubscriptionCleanupService,
    MasterSyncService,
  ],
})
export class TradingModule {}
