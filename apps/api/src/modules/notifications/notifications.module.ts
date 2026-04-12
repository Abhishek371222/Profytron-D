import { Module, Global } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

import { TradingModule } from '../trading/trading.module';

@Global()
@Module({
  imports: [TradingModule],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
