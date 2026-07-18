import { Module, Global } from '@nestjs/common';
import { BrokerService } from './broker.service';
import { BrokerController, BrokerSharesController } from './broker.controller';
import { CryptoService } from '../../common/crypto.service';
import { MetaTraderAdapter } from './adapters/metatrader.adapter';
import { PaperBrokerAdapter } from './adapters/paper.adapter';
import { AccountHistorySyncService } from './account-history-sync.service';
import { AccountSnapshotGateway } from './account-snapshot.gateway';
import { AccountSnapshotController } from './account-snapshot.controller';
import { AccountSnapshotService } from './account-snapshot.service';
import { BullModule } from '@nestjs/bull';
import { GrowthModule } from '../growth/growth.module';
import { AuthModule } from '../auth/auth.module';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'copyfactory_sync',
    }),
    GrowthModule,
    AuthModule,
  ],
  controllers: [
    BrokerController,
    BrokerSharesController,
    AccountSnapshotController,
  ],
  providers: [
    BrokerService,
    CryptoService,
    MetaTraderAdapter,
    PaperBrokerAdapter,
    AccountHistorySyncService,
    AccountSnapshotGateway,
    AccountSnapshotService,
  ],
  exports: [
    BrokerService,
    MetaTraderAdapter,
    CryptoService,
    AccountHistorySyncService,
    AccountSnapshotGateway,
    AccountSnapshotService,
  ],
})
export class BrokerModule {}
