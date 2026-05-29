import { Module } from '@nestjs/common';
import { StrategyBuilderService } from './strategy-builder.service';

@Module({
  providers: [StrategyBuilderService],
  exports: [StrategyBuilderService],
})
export class StrategyBuilderModule {}
