import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { FcmService } from './fcm.service';
import { NotificationProcessor } from './notification.processor';
import { TradingModule } from '../trading/trading.module';

@Global()
@Module({
  imports: [
    TradingModule,
    BullModule.registerQueue({
      name: 'notifications_dispatch',
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 1000,
        removeOnFail: false,
      },
    }),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, FcmService, NotificationProcessor],
  exports: [NotificationsService, FcmService],
})
export class NotificationsModule {}
