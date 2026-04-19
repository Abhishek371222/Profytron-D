import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { TradingGateway } from './trading.gateway';
import { TradeDirection, TradeStatus } from '@prisma/client';

@Processor('trade_execution')
export class TradeProcessor {
  private readonly logger = new Logger(TradeProcessor.name);

  constructor(
    private prisma: PrismaService,
    private gateway: TradingGateway,
  ) {}

  @Process('execute_trade')
  async handleTradeExecution(job: Job<any>) {
    const { userId, signalId, strategyId, type, pair, price } = job.data;
    this.logger.log(`Executing trade for user ${userId} on ${pair}`);

    try {
      // 1. Fetch user's active broker account
      const brokerAccount = await this.prisma.brokerAccount.findFirst({
        where: { userId, isActive: true, isDefault: true },
      });

      if (!brokerAccount) {
        this.logger.error(`No default broker account for user ${userId}`);
        return;
      }

      // 2. Map direction
      const direction =
        type === 'BUY' ? TradeDirection.LONG : TradeDirection.SHORT;

      // 3. Create Trade Record (Simulation)
      const trade = await this.prisma.trade.create({
        data: {
          userId,
          strategyId,
          brokerAccountId: brokerAccount.id,
          symbol: pair,
          direction,
          volume: 0.1, // Fixed lot for simulation
          openPrice: price,
          status: TradeStatus.OPEN,
          openedAt: new Date(),
          isPaper: brokerAccount.isPaperTrading,
        },
      });

      // 4. Notify Frontend
      this.gateway.sendToUser(userId, 'trade_opened', trade);

      this.logger.log(`Trade ${trade.id} opened successfully for ${userId}`);

      // 5. Automated "Close" after 10s for simulation purposes if it's paper
      if (brokerAccount.isPaperTrading) {
        setTimeout(async () => {
          const closePrice = price * (1 + (Math.random() * 0.02 - 0.01)); // +/- 1%
          const profitValue =
            (closePrice - price) *
            (direction === TradeDirection.LONG ? 1 : -1) *
            1000;

          const closedTrade = await this.prisma.trade.update({
            where: { id: trade.id },
            data: {
              status: TradeStatus.CLOSED,
              closePrice,
              profit: profitValue,
              closedAt: new Date(),
            },
          });

          this.gateway.sendToUser(userId, 'trade_closed', closedTrade);
          this.logger.log(
            `Auto-closed paper trade ${trade.id} with profit ${profitValue}`,
          );
        }, 10000);
      }
    } catch (error) {
      this.logger.error(`Failed to execute trade: ${error.message}`);
    }
  }
}
