import { Module } from '@nestjs/common';
import { AiRiskService } from './ai-risk.service';

@Module({
  providers: [AiRiskService],
  exports: [AiRiskService],
})
export class AiRiskModule {}
