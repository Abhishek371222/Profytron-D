import { Module, Global } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { RedisModule } from '../auth/redis.module';
import { GrowthModule } from '../growth/growth.module';

@Global()
@Module({
  imports: [RedisModule, GrowthModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
