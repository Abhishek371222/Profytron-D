import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { WalletProcessor } from './wallet.processor';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    forwardRef(() => NotificationsModule),
    BullModule.registerQueue({
      name: 'withdrawal-processing',
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    }),
    BullModule.registerQueue({
      name: 'copyfactory_sync',
    }),
  ],
  controllers: [WalletController],
  providers: [WalletService, WalletProcessor],
  exports: [WalletService],
})
export class WalletModule {}
