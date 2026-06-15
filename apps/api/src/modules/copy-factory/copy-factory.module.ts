import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { CopyFactoryService } from './copy-factory.service';
import { CopyFactorySyncService } from './copy-factory-sync.service';
import { CopyFactoryProcessor } from './copy-factory.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'copyfactory_sync',
    }),
  ],
  providers: [CopyFactoryService, CopyFactorySyncService, CopyFactoryProcessor],
  exports: [CopyFactoryService, CopyFactorySyncService],
})
export class CopyFactoryModule {}
