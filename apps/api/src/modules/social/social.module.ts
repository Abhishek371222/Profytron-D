import { Module } from '@nestjs/common';
import { SocialTradingService } from './social-trading.service';

@Module({
  providers: [SocialTradingService],
  exports: [SocialTradingService],
})
export class SocialModule {}
