import { Global, Module } from '@nestjs/common';
import { RedisService, REDIS_CLIENT } from './redis.service';
import { redisClient } from '../../config/redis.config';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useValue: redisClient,
    },
    RedisService,
  ],
  exports: [RedisService, REDIS_CLIENT],
})
export class RedisModule {}
