import { Module } from '@nestjs/common';
import { ActivationService } from './activation.service';
import { LifecycleService } from './lifecycle.service';
import { GrowthController } from './growth.controller';
import { EmailModule } from '../email/email.module';
import { RedisModule } from '../auth/redis.module';

@Module({
  imports: [EmailModule, RedisModule],
  controllers: [GrowthController],
  providers: [ActivationService, LifecycleService],
  exports: [ActivationService, LifecycleService],
})
export class GrowthModule {}
