import { Module } from '@nestjs/common';
import { TradingModule } from '../trading/trading.module';

@Module({
  imports: [TradingModule],
  exports: [TradingModule],
})
export class WebsocketModule {}
