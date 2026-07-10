import { createHash, randomBytes } from 'crypto';
import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type BridgeAction = 'OPEN' | 'CLOSE' | 'MODIFY';

@Injectable()
export class CopyBridgeService {
  private readonly logger = new Logger(CopyBridgeService.name);

  constructor(private readonly prisma: PrismaService) {}

  static hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  static mintToken(): string {
    return randomBytes(32).toString('hex');
  }

  async enqueue(params: {
    userId: string;
    brokerAccountId: string;
    subscriptionId?: string | null;
    followerTradeId?: string | null;
    masterPositionId?: string | null;
    action: BridgeAction;
    symbol: string;
    side?: string | null;
    volume: number;
    price?: number | null;
    stopLoss?: number | null;
    takeProfit?: number | null;
    brokerTicket?: string | null;
  }) {
    const order = await this.prisma.copyBridgeOrder.create({
      data: {
        userId: params.userId,
        brokerAccountId: params.brokerAccountId,
        subscriptionId: params.subscriptionId ?? null,
        followerTradeId: params.followerTradeId ?? null,
        masterPositionId: params.masterPositionId ?? null,
        action: params.action,
        symbol: params.symbol,
        side: params.side ?? null,
        volume: params.volume,
        price: params.price ?? null,
        stopLoss: params.stopLoss ?? null,
        takeProfit: params.takeProfit ?? null,
        brokerTicket: params.brokerTicket ?? null,
        status: 'PENDING',
      },
    });

    this.logger.log(
      `Bridge ${params.action} queued ${order.id} for account ${params.brokerAccountId} ${params.symbol}`,
    );
    return order;
  }

  async resolveAccountByToken(rawToken: string | undefined) {
    if (!rawToken?.trim()) {
      throw new UnauthorizedException('Missing bridge token');
    }
    const hash = CopyBridgeService.hashToken(rawToken.trim());
    const account = await this.prisma.brokerAccount.findFirst({
      where: { bridgeTokenHash: hash, isActive: true },
      select: {
        id: true,
        userId: true,
        brokerName: true,
        serverName: true,
        accountNumberLast4: true,
        isPaperTrading: true,
      },
    });
    if (!account || account.isPaperTrading) {
      throw new UnauthorizedException('Invalid bridge token');
    }
    return account;
  }

  async pollPending(rawToken: string, limit = 10) {
    const account = await this.resolveAccountByToken(rawToken);
    const take = Math.min(Math.max(1, limit), 25);

    const pending = await this.prisma.copyBridgeOrder.findMany({
      where: {
        brokerAccountId: account.id,
        status: 'PENDING',
      },
      orderBy: { createdAt: 'asc' },
      take,
    });

    if (pending.length === 0) {
      return { accountId: account.id, orders: [] as typeof pending };
    }

    const ids = pending.map((o) => o.id);
    await this.prisma.copyBridgeOrder.updateMany({
      where: { id: { in: ids }, status: 'PENDING' },
      data: { status: 'CLAIMED', claimedAt: new Date() },
    });

    const claimed = await this.prisma.copyBridgeOrder.findMany({
      where: { id: { in: ids }, status: 'CLAIMED' },
      orderBy: { createdAt: 'asc' },
    });

    return {
      accountId: account.id,
      orders: claimed.map((o) => ({
        id: o.id,
        action: o.action,
        symbol: o.symbol,
        side: o.side,
        volume: o.volume,
        price: o.price,
        stopLoss: o.stopLoss,
        takeProfit: o.takeProfit,
        followerTradeId: o.followerTradeId,
        masterPositionId: o.masterPositionId,
        brokerTicket: o.brokerTicket,
      })),
    };
  }

  async reportResult(
    rawToken: string,
    orderId: string,
    body: {
      status: 'FILLED' | 'FAILED';
      brokerTicket?: string;
      fillPrice?: number;
      errorReason?: string;
    },
  ) {
    const account = await this.resolveAccountByToken(rawToken);
    const order = await this.prisma.copyBridgeOrder.findFirst({
      where: { id: orderId, brokerAccountId: account.id },
    });
    if (!order) {
      throw new BadRequestException('Order not found');
    }
    if (order.status === 'FILLED' || order.status === 'FAILED') {
      return order;
    }
    if (body.status !== 'FILLED' && body.status !== 'FAILED') {
      throw new BadRequestException('status must be FILLED or FAILED');
    }

    const updated = await this.prisma.copyBridgeOrder.update({
      where: { id: order.id },
      data: {
        status: body.status,
        brokerTicket: body.brokerTicket ?? order.brokerTicket,
        errorReason: body.errorReason ?? null,
        filledAt: body.status === 'FILLED' ? new Date() : null,
      },
    });

    if (
      body.status === 'FILLED' &&
      order.followerTradeId &&
      body.brokerTicket
    ) {
      await this.prisma.trade
        .update({
          where: { id: order.followerTradeId },
          data: {
            brokerTicket: body.brokerTicket,
            ...(body.fillPrice != null ? { fillPrice: body.fillPrice } : {}),
          },
        })
        .catch(() => undefined);
    }

    return updated;
  }
}
