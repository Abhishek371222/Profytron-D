import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { TradingModule } from '../trading/trading.module';
import { CopyFactoryModule } from '../copy-factory/copy-factory.module';
import { MarketplaceModule } from '../marketplace/marketplace.module';

@Module({
  imports: [TradingModule, CopyFactoryModule, MarketplaceModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
