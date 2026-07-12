import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TradingService } from './trading.service';
import { TradingController } from './trading.controller';
import { TradingGateway } from './trading.gateway';
import { TradeProcessor } from './trade.processor';
import { AuthModule } from '../auth/auth.module';
import { SubscriptionCleanupService } from './subscription-cleanup.service';
import { MasterSyncService } from './master-sync.service';
import { TrailingStopService } from './trailing-stop.service';
import { CopyFactoryModule } from '../copy-factory/copy-factory.module';
import { GrowthModule } from '../growth/growth.module';
import { MarketModule } from '../market/market.module';
import { MarketPriceBroadcastService } from './market-price-broadcast.service';
import { AiRiskModule } from '../ai-risk/ai-risk.module';
import { CopyLedgerService } from './copy-ledger.service';
import { TradeDlqProcessor } from './trade-dlq.processor';
import { CopyFactoryPositionSyncService } from './copy-factory-position-sync.service';
import { BotTradeSyncService } from './bot-trade-sync.service';
import { CopyBridgeModule } from '../copy-bridge/copy-bridge.module';

@Module({
  imports: [
    AuthModule,
    forwardRef(() => CopyFactoryModule),
    GrowthModule,
    MarketModule,
    AiRiskModule,
    CopyBridgeModule,
    BullModule.registerQueue(
      {
        name: 'trade_execution',
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: 1000,
          removeOnFail: false,
        },
      },
      { name: 'trade_execution_dlq' },
    ),
  ],
  controllers: [TradingController],
  providers: [
    TradingService,
    TradingGateway,
    TradeProcessor,
    TradeDlqProcessor,
    SubscriptionCleanupService,
    MasterSyncService,
    TrailingStopService,
    MarketPriceBroadcastService,
    CopyLedgerService,
    CopyFactoryPositionSyncService,
    BotTradeSyncService,
  ],
  exports: [
    TradingService,
    TradingGateway,
    TradeProcessor,
    SubscriptionCleanupService,
    MasterSyncService,
    TrailingStopService,
    BotTradeSyncService,
  ],
})
export class TradingModule {}
