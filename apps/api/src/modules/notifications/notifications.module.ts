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
        // Trim succeeded jobs but KEEP failed ones so the Bull "failed" set acts
        // as a dead-letter queue — failed sends are inspectable and replayable
        // instead of vanishing.
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
