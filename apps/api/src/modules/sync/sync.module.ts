import { Module } from '@nestjs/common';
import { RedisModule } from '../auth/redis.module';
import { SyncStateService } from './sync-state.service';
import { SyncEngineService } from './sync-engine.service';

@Module({
  imports: [RedisModule],
  providers: [SyncStateService, SyncEngineService],
  exports: [SyncStateService, SyncEngineService],
})
export class SyncModule {}
