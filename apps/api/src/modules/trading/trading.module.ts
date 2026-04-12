import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TradingService } from './trading.service';
import { TradingController } from './trading.controller';
import { TradingGateway } from './trading.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    BullModule.registerQueue({
      name: 'trade_execution',
    }),
  ],
  controllers: [TradingController],
  providers: [TradingService, TradingGateway],
  exports: [TradingService, TradingGateway],
})
export class TradingModule {}
