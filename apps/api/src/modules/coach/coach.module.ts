import { Module } from '@nestjs/common';
import { CoachService } from './coach.service';
import { CoachController } from './coach.controller';
import { CoachGateway } from './coach.gateway';
import { CoachInsightsService } from './coach-insights.service';
import { AIModule } from '../ai/ai.module';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from '../auth/redis.module';

@Module({
  imports: [AIModule, AuthModule, RedisModule],
  controllers: [CoachController],
  providers: [CoachService, CoachGateway, CoachInsightsService],
  exports: [CoachService, CoachGateway, CoachInsightsService],
})
export class CoachModule {}
