import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { AiRiskService } from './ai-risk.service';
import { AiRiskController } from './ai-risk.controller';
import { RedisModule } from '../auth/redis.module';

@Module({
  imports: [
    RedisModule,
    BullModule.registerQueue(
      { name: 'trade_execution' },
      { name: 'copyfactory_sync' },
    ),
  ],
  controllers: [AiRiskController],
  providers: [AiRiskService],
  exports: [AiRiskService],
})
export class AiRiskModule {}
