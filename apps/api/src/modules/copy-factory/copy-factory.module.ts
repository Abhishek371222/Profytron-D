import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { CopyFactoryService } from './copy-factory.service';
import { CopyFactorySyncService } from './copy-factory-sync.service';
import { CopyFactoryProcessor } from './copy-factory.processor';
import { ProvisioningModule } from '../provisioning/provisioning.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'copyfactory_sync',
      defaultJobOptions: {
        attempts: 4,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: 50,
      },
    }),
    ProvisioningModule,
  ],
  providers: [CopyFactoryService, CopyFactorySyncService, CopyFactoryProcessor],
  exports: [CopyFactoryService, CopyFactorySyncService],
})
export class CopyFactoryModule {}
