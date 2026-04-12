import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TradingGateway } from '../trading/trading.gateway';
import { EmailService } from '../email/email.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private gateway: TradingGateway,
    private emailService: EmailService,
  ) {}

  async create(
    userId: string,
    title: string,
    message: string,
    type: NotificationType = 'INFO',
    actionUrl?: string,
    sendEmail = false,
  ) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        title,
        body: message,
        type,
        actionUrl,
      },
    });

    // Push real-time via WebSocket
    this.gateway.sendToUser(userId, 'new_notification', notification);

    if (sendEmail) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, fullName: true },
      });

      if (user) {
        await this.emailService.sendNotificationEmail(
          user.email,
          user.fullName,
          title,
          message,
          actionUrl,
        );
      }
    }

    return notification;
  }

  async findAll(userId: string, page = 1, limit = 20, unreadOnly = false) {
    const where = {
      userId,
      ...(unreadOnly ? { isRead: false } : {}),
    };

    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      unreadCount,
      hasMore: page * limit < total,
    };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });

    return { count };
  }

  async markAsRead(id: string, userId: string) {
    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });

    return this.prisma.notification.findUnique({ where: { id } });
  }

  async markAllAsRead(userId: string) {
    const updated = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { updated: updated.count };
  }
}
