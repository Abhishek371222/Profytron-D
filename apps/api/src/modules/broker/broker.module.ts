import { Module, Global } from '@nestjs/common';
import { BrokerService } from './broker.service';
import { BrokerController, BrokerSharesController } from './broker.controller';
import { CryptoService } from '../../common/crypto.service';
import { MetaTraderAdapter } from './adapters/metatrader.adapter';
import { PaperBrokerAdapter } from './adapters/paper.adapter';
import { AccountHistorySyncService } from './account-history-sync.service';
import { BullModule } from '@nestjs/bull';
import { GrowthModule } from '../growth/growth.module';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'copyfactory_sync',
    }),
    GrowthModule,
  ],
  controllers: [BrokerController, BrokerSharesController],
  providers: [
    BrokerService,
    CryptoService,
    MetaTraderAdapter,
    PaperBrokerAdapter,
    AccountHistorySyncService,
  ],
  exports: [
    BrokerService,
    MetaTraderAdapter,
    CryptoService,
    AccountHistorySyncService,
  ],
})
export class BrokerModule {}
