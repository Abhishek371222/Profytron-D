import { Module } from '@nestjs/common';
import { CopyTradingService } from './copy.service';
import { CopyController } from './copy.controller';

@Module({
  controllers: [CopyController],
  providers: [CopyTradingService],
  exports: [CopyTradingService],
})
export class CopyModule {}
