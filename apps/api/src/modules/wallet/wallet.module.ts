import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { WalletProcessor } from './wallet.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'withdrawal-processing',
    }),
  ],
  controllers: [WalletController],
  providers: [WalletService, WalletProcessor],
  exports: [WalletService],
})
export class WalletModule {}
