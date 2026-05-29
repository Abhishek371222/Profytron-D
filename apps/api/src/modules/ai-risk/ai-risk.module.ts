import { Module } from '@nestjs/common';
import { AiRiskService } from './ai-risk.service';
import { AiRiskController } from './ai-risk.controller';
import { RedisModule } from '../auth/redis.module';

@Module({
  imports: [RedisModule],
  controllers: [AiRiskController],
  providers: [AiRiskService],
  exports: [AiRiskService],
})
export class AiRiskModule {}
