import { Module, Global } from '@nestjs/common';
import { BrokerService } from './broker.service';
import { BrokerController } from './broker.controller';
import { CryptoService } from '../../common/crypto.service';
import { MetaTraderAdapter } from './adapters/metatrader.adapter';
import { PaperBrokerAdapter } from './adapters/paper.adapter';

@Global()
@Module({
  controllers: [BrokerController],
  providers: [BrokerService, CryptoService, MetaTraderAdapter, PaperBrokerAdapter],
  exports: [BrokerService, MetaTraderAdapter, CryptoService],
})
export class BrokerModule {}
