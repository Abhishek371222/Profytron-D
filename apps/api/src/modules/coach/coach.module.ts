import { Module } from '@nestjs/common';
import { CoachService } from './coach.service';
import { CoachController } from './coach.controller';
import { CoachGateway } from './coach.gateway';
import { AIModule } from '../ai/ai.module';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from '../auth/redis.module';

@Module({
  imports: [AIModule, AuthModule, RedisModule],
  controllers: [CoachController],
  providers: [CoachService, CoachGateway],
  exports: [CoachService, CoachGateway],
})
export class CoachModule {}
