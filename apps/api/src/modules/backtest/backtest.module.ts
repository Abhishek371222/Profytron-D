import { Module } from '@nestjs/common';
import { BacktestService } from './backtest.service';
import { MarketModule } from '../market/market.module';
import { RedisModule } from '../auth/redis.module';

@Module({
  imports: [MarketModule, RedisModule],
  providers: [BacktestService],
  exports: [BacktestService],
})
export class BacktestModule {}
