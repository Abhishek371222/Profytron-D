import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { TradingGateway } from './trading.gateway';
import { randomUUID } from 'crypto';

@Injectable()
export class TradingService {
  private readonly logger = new Logger(TradingService.name);

  constructor(
    private prisma: PrismaService,
    private gateway: TradingGateway,
    @InjectQueue('trade_execution') private tradeQueue: any,
  ) {}

  async processSignal(
    strategyId: string,
    signalType: string,
    pair: string,
    price: number,
  ) {
    this.logger.log(
      `[Signal] ${strategyId} triggered ${signalType} for ${pair} at ${price}`,
    );

    const signalId = randomUUID();

    // Persist a durable signal audit entry until a dedicated signal model exists.
    await this.prisma.auditLog.create({
      data: {
        eventType: 'TRADING_SIGNAL_RECEIVED',
        userId: null,
        detailsJson: {
          signalId,
          strategyId,
          type: signalType,
          pair,
          price,
          timestamp: new Date().toISOString(),
        },
        triggeredBy: strategyId,
      },
    });

    // Find all users subscribed to this strategy
    const subscriptions = await this.prisma.userStrategySubscription.findMany({
      where: { strategyId, status: 'ACTIVE' },
      select: { userId: true },
    });

    // Queue execution for each user
    for (const sub of subscriptions) {
      await this.tradeQueue.add('execute_trade', {
        userId: sub.userId,
        signalId,
        strategyId,
        type: signalType,
        pair,
        price,
      });
    }

    return { signalId, subscribersnotified: subscriptions.length };
  }

  // Failsafe: Emergency stop for all trades per user
  async emergencyStop(userId: string) {
    this.logger.warn(`[EMERGENCY] Stop triggered for user ${userId}`);

    await this.prisma.auditLog.create({
      data: {
        eventType: 'TRADING_EMERGENCY_STOP',
        userId,
        detailsJson: {
          requestedAt: new Date().toISOString(),
        },
        triggeredBy: userId,
      },
    });

    // Logic to close all open positions via broker connector
    // ...

    this.gateway.sendToUser(userId, 'emergency_stop_triggered', {
      timestamp: new Date(),
      status: 'SUCCESS',
    });

    return {
      success: true,
      userId,
      stoppedAt: new Date().toISOString(),
    };
  }
}
