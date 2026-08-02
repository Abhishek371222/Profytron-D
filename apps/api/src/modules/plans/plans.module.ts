import { Module, forwardRef } from '@nestjs/common';
import { PlansController } from './plans.controller';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [forwardRef(() => PaymentsModule)],
  controllers: [PlansController],
})
export class PlansModule {}
