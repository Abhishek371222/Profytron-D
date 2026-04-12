import { Module, Global } from '@nestjs/common';
import { BrokerService } from './broker.service';
import { BrokerController } from './broker.controller';
import { CryptoService } from '../../common/crypto.service';
import { MT5Adapter } from './adapters/mt5.adapter';
import { PaperBrokerAdapter } from './adapters/paper.adapter';

@Global()
@Module({
  controllers: [BrokerController],
  providers: [BrokerService, CryptoService, MT5Adapter, PaperBrokerAdapter],
  exports: [BrokerService],
})
export class BrokerModule {}
