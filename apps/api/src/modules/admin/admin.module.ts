import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { TradingModule } from '../trading/trading.module';
import { CopyFactoryModule } from '../copy-factory/copy-factory.module';
import { MarketplaceModule } from '../marketplace/marketplace.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [TradingModule, CopyFactoryModule, MarketplaceModule, WalletModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
