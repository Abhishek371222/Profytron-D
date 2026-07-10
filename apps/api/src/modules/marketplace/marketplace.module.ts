import { Module } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { MarketplaceController } from './marketplace.controller';
import { StrategyDocumentsService } from './strategy-documents.service';
import { GrowthModule } from '../growth/growth.module';
import { PaymentsModule } from '../payments/payments.module';
import { ProvisioningModule } from '../provisioning/provisioning.module';
import { CopyFactoryModule } from '../copy-factory/copy-factory.module';

@Module({
  imports: [
    GrowthModule,
    PaymentsModule,
    ProvisioningModule,
    CopyFactoryModule,
  ],
  controllers: [MarketplaceController],
  providers: [MarketplaceService, StrategyDocumentsService],
  exports: [MarketplaceService, StrategyDocumentsService],
})
export class MarketplaceModule {}
