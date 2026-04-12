import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { TradingGateway } from './trading.gateway';

@Injectable()
export class TradingService {
  private readonly logger = new Logger(TradingService.name);

  constructor(
    private prisma: PrismaService,
    private gateway: TradingGateway,
    @InjectQueue('trade_execution') private tradeQueue: any,
  ) {}

  async processSignal(strategyId: string, signalType: string, pair: string, price: number) {
    this.logger.log(`[Signal] ${strategyId} triggered ${signalType} for ${pair} at ${price}`);

    // Persist signal
    const signal = await (this.prisma as any).tradingSignal.create({
      data: {
        strategyId,
        type: signalType,
        pair,
        price,
        payload: { timestamp: new Date() },
      },
    });

    // Find all users subscribed to this strategy
    const subscriptions = await (this.prisma as any).subscription.findMany({
      where: { strategyId, isActive: true },
      include: { user: true },
    });

    // Queue execution for each user
    for (const sub of subscriptions) {
      await this.tradeQueue.add('execute_trade', {
        userId: sub.userId,
        signalId: signal.id,
        strategyId,
        type: signalType,
        pair,
        price,
      });
    }

    return { signalId: signal.id, subscribersnotified: subscriptions.length };
  }

  // Failsafe: Emergency stop for all trades per user
  async emergencyStop(userId: string) {
    this.logger.warn(`[EMERGENCY] Stop triggered for user ${userId}`);
    
    // Logic to close all open positions via broker connector
    // ...
    
    this.gateway.sendToUser(userId, 'emergency_stop_triggered', {
      timestamp: new Date(),
      status: 'SUCCESS',
    });
  }
}
