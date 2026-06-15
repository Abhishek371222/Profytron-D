import { Module, Global } from '@nestjs/common';
import { BrokerService } from './broker.service';
import { BrokerController } from './broker.controller';
import { CryptoService } from '../../common/crypto.service';
import { MetaTraderAdapter } from './adapters/metatrader.adapter';
import { PaperBrokerAdapter } from './adapters/paper.adapter';
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
  controllers: [BrokerController],
  providers: [
    BrokerService,
    CryptoService,
    MetaTraderAdapter,
    PaperBrokerAdapter,
  ],
  exports: [BrokerService, MetaTraderAdapter, CryptoService],
})
export class BrokerModule {}
