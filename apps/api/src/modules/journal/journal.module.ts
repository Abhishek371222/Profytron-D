import { Module } from '@nestjs/common';
import { TradingJournalService } from './trading-journal.service';
import { JournalController } from './journal.controller';

@Module({
  controllers: [JournalController],
  providers: [TradingJournalService],
  exports: [TradingJournalService],
})
export class JournalModule {}
