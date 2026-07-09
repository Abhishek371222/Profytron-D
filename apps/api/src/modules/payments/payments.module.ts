import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { RazorpayController } from './razorpay.controller';
import { SubscriptionsController } from '../subscriptions/subscriptions.controller';
import { PaymentsService } from './payments.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { TradingModule } from '../trading/trading.module';
import { RedisModule } from '../auth/redis.module';
import { CopyFactoryModule } from '../copy-factory/copy-factory.module';
import { AffiliatesModule } from '../affiliates/affiliates.module';
import { GrowthModule } from '../growth/growth.module';
import { AgentsModule } from '../agents/agents.module';
import { ProvisioningModule } from '../provisioning/provisioning.module';

@Module({
  imports: [
    NotificationsModule,
    TradingModule,
    CopyFactoryModule,
    RedisModule,
    AffiliatesModule,
    GrowthModule,
    AgentsModule,
    ProvisioningModule,
  ],
  controllers: [
    PaymentsController,
    RazorpayController,
    SubscriptionsController,
  ],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
