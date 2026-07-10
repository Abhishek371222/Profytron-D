import { Module } from '@nestjs/common';
import { StrategiesService } from './strategies.service';
import { StrategiesController } from './strategies.controller';
import { CopyFactoryModule } from '../copy-factory/copy-factory.module';
import { BacktestModule } from '../backtest/backtest.module';
import { MarketplaceModule } from '../marketplace/marketplace.module';

@Module({
  imports: [CopyFactoryModule, BacktestModule, MarketplaceModule],
  controllers: [StrategiesController],
  providers: [StrategiesService],
  exports: [StrategiesService],
})
export class StrategiesModule {}
