import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { StrategiesModule } from './modules/strategies/strategies.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { TradingModule } from './modules/trading/trading.module';
import { AdminModule } from './modules/admin/admin.module';
import { BrokerModule } from './modules/broker/broker.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
    PrismaModule,
    AuthModule,
    StrategiesModule,
    WalletModule,
    TradingModule,
    AdminModule,
    BrokerModule,
    NotificationsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
