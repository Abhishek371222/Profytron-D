import { Module } from '@nestjs/common';
import { StrategyBuilderService } from './strategy-builder.service';
import { StrategyBuilderController } from './strategy-builder.controller';
import { BacktestModule } from '../backtest/backtest.module';
import { StrategiesModule } from '../strategies/strategies.module';

@Module({
  imports: [BacktestModule, StrategiesModule],
  controllers: [StrategyBuilderController],
  providers: [StrategyBuilderService],
  exports: [StrategyBuilderService],
})
export class StrategyBuilderModule {}
