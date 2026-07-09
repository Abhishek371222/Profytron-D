import { Module, forwardRef } from '@nestjs/common';
import { SubscriptionProvisioningService } from './subscription-provisioning.service';
import { TradingModule } from '../trading/trading.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule, forwardRef(() => TradingModule)],
  providers: [SubscriptionProvisioningService],
  exports: [SubscriptionProvisioningService],
})
export class ProvisioningModule {}
