import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TradingGateway } from '../trading/trading.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private gateway: TradingGateway,
  ) {}

  async create(
    userId: string,
    title: string,
    message: string,
    type: string = 'INFO',
  ) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        title,
        body: message,
        type: type as any,
      },
    });

    // Push real-time via WebSocket
    this.gateway.sendToUser(userId, 'new_notification', notification);

    return notification;
  }

  async findAll(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }
}
