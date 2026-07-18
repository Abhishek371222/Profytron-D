import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { TradingGateway } from '../trading/trading.gateway';
import { NotificationType } from '@prisma/client';

export type NotificationCategory =
  | 'SECURITY'
  | 'TRADING'
  | 'PAYMENT'
  | 'ACCOUNT'
  | 'SYSTEM'
  | 'MARKETING'
  | 'COPY_TRADING'
  | 'STRATEGY'
  | 'AI'
  | 'REFERRAL'
  | 'ADMIN';

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface CreateNotificationDto {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  actionUrl?: string;
  icon?: string;
  metadata?: Record<string, any>;
  sendEmail?: boolean;
  sendPush?: boolean;
}

const CATEGORY_PREF_MAP: Record<NotificationCategory, string> = {
  SECURITY: 'securityAlerts',
  TRADING: 'tradingAlerts',
  COPY_TRADING: 'tradingAlerts',
  PAYMENT: 'paymentAlerts',
  ACCOUNT: 'accountAlerts',
  SYSTEM: 'systemAlerts',
  MARKETING: 'marketingAlerts',
  STRATEGY: 'tradingAlerts',
  AI: 'systemAlerts',
  REFERRAL: 'marketingAlerts',
  ADMIN: 'systemAlerts',
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private gateway: TradingGateway,
    @InjectQueue('notifications_dispatch') private dispatchQueue: Queue,
  ) {}

  async create(dto: CreateNotificationDto): Promise<any>;
  async create(
    userId: string,
    title: string,
    message: string,
    type?: NotificationType,
    actionUrl?: string,
    sendEmail?: boolean,
  ): Promise<any>;
  async create(
    dtoOrUserId: CreateNotificationDto | string,
    title?: string,
    message?: string,
    type: NotificationType = 'INFO',
    actionUrl?: string,
    sendEmail = false,
  ) {
    const dto: CreateNotificationDto =
      typeof dtoOrUserId === 'string'
        ? {
            userId: dtoOrUserId,
            title: title!,
            message: message!,
            type,
            actionUrl,
            sendEmail,
          }
        : dtoOrUserId;

    const {
      userId,
      title: t,
      message: m,
      type: ty = 'INFO',
      category = 'SYSTEM',
      priority = 'NORMAL',
      actionUrl: url,
      icon,
      metadata,
      sendEmail: doEmail = false,
      sendPush: doPush = false,
    } = dto;

    const prefs = await this.getPreferences(userId);
    const prefField = CATEGORY_PREF_MAP[category] ?? 'systemAlerts';
    const categoryEnabled = prefs[prefField] ?? true;

    if (!categoryEnabled && priority !== 'CRITICAL') {
      this.logger.debug(
        `Skipping notification for ${userId}: category ${category} disabled by preference`,
      );
      return null;
    }

    if (priority !== 'CRITICAL' && priority !== 'HIGH') {
      if (
        prefs.quietHoursEnabled &&
        this.isQuietHours(prefs.quietHoursStart, prefs.quietHoursEnd)
      ) {
        if (doEmail) dto.sendEmail = false;
        if (doPush) dto.sendPush = false;
      }
    }

    let notification: any = null;
    if (prefs.inAppEnabled || priority === 'CRITICAL') {
      try {
        notification = await this.prisma.notification.create({
          data: {
            userId,
            title: t,
            body: m,
            type: ty,
            category,
            priority,
            actionUrl: url,
            icon: icon ?? null,
            metadata: metadata ?? undefined,
            isRead: false,
            isSeen: false,
          },
        });

        this.gateway.sendToUser(userId, 'new_notification', {
          ...notification,
          unreadCount: await this.prisma.notification.count({
            where: { userId, isRead: false },
          }),
        });

        void this.logDelivery(notification.id, userId, 'IN_APP', 'SENT');
      } catch (err) {
        const code = (err as { code?: string })?.code;
        if (code === 'P2003' || code === 'P2025') {
          this.logger.warn(
            `Skipping in-app notification for missing user ${userId} (${code})`,
          );
          return null;
        }
        this.logger.error(
          `Failed to persist in-app notification for ${userId}: ${
            (err as Error)?.message ?? err
          }`,
        );
        return null;
      }
    }

    const shouldEmail = doEmail && prefs.emailEnabled;
    const shouldPush = doPush && prefs.pushEnabled;

    if (shouldEmail || shouldPush) {
      await this.dispatchQueue.add(
        'dispatch_notification',
        {
          userId,
          notificationId: notification?.id,
          title: t,
          body: m,
          actionUrl: url,
          sendEmail: shouldEmail,
          sendPush: shouldPush,
          category,
          priority,
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: true,
        },
      );
    }

    return notification;
  }

  async getPreferences(userId: string) {
    const existing = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });
    if (existing) return existing;
    try {
      return await this.prisma.notificationPreference.create({
        data: { userId },
      });
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code !== 'P2003' && code !== 'P2025') throw err;
      this.logger.warn(
        `No preference row for user ${userId} (${code}); using transient defaults`,
      );
      return { userId, inAppEnabled: true } as any;
    }
  }

  async updatePreferences(
    userId: string,
    updates: Partial<{
      inAppEnabled: boolean;
      emailEnabled: boolean;
      pushEnabled: boolean;
      securityAlerts: boolean;
      tradingAlerts: boolean;
      paymentAlerts: boolean;
      systemAlerts: boolean;
      marketingAlerts: boolean;
      accountAlerts: boolean;
      quietHoursEnabled: boolean;
      quietHoursStart: string;
      quietHoursEnd: string;
    }>,
  ) {
    const allowed = {
      ...(typeof updates.inAppEnabled === 'boolean'
        ? { inAppEnabled: updates.inAppEnabled }
        : {}),
      ...(typeof updates.emailEnabled === 'boolean'
        ? { emailEnabled: updates.emailEnabled }
        : {}),
      ...(typeof updates.pushEnabled === 'boolean'
        ? { pushEnabled: updates.pushEnabled }
        : {}),
      ...(typeof updates.securityAlerts === 'boolean'
        ? { securityAlerts: updates.securityAlerts }
        : {}),
      ...(typeof updates.tradingAlerts === 'boolean'
        ? { tradingAlerts: updates.tradingAlerts }
        : {}),
      ...(typeof updates.paymentAlerts === 'boolean'
        ? { paymentAlerts: updates.paymentAlerts }
        : {}),
      ...(typeof updates.systemAlerts === 'boolean'
        ? { systemAlerts: updates.systemAlerts }
        : {}),
      ...(typeof updates.marketingAlerts === 'boolean'
        ? { marketingAlerts: updates.marketingAlerts }
        : {}),
      ...(typeof updates.accountAlerts === 'boolean'
        ? { accountAlerts: updates.accountAlerts }
        : {}),
      ...(typeof updates.quietHoursEnabled === 'boolean'
        ? { quietHoursEnabled: updates.quietHoursEnabled }
        : {}),
      ...(typeof updates.quietHoursStart === 'string'
        ? { quietHoursStart: updates.quietHoursStart }
        : {}),
      ...(typeof updates.quietHoursEnd === 'string'
        ? { quietHoursEnd: updates.quietHoursEnd }
        : {}),
    };

    return this.prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId, ...allowed },
      update: allowed,
    });
  }

  async findAll(
    userId: string,
    page = 1,
    limit = 20,
    unreadOnly = false,
    category?: string,
  ) {
    const where = {
      userId,
      ...(unreadOnly ? { isRead: false } : {}),
      ...(category ? { category } : {}),
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
      data: { isRead: true, isSeen: true },
    });
    return this.prisma.notification.findFirst({ where: { id, userId } });
  }

  async markAllAsRead(userId: string) {
    const updated = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, isSeen: true },
    });
    return { updated: updated.count };
  }

  async markSeen(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isSeen: false },
      data: { isSeen: true },
    });
    return { success: true };
  }

  async deleteNotification(id: string, userId: string) {
    await this.prisma.notification.deleteMany({ where: { id, userId } });
    return { success: true };
  }

  async deleteAll(userId: string) {
    const { count } = await this.prisma.notification.deleteMany({
      where: { userId },
    });
    return { deleted: count };
  }

  async logDelivery(
    notificationId: string | null,
    userId: string,
    channel: string,
    status: string,
    providerResponse?: any,
  ) {
    try {
      await this.prisma.notificationLog.create({
        data: {
          notificationId,
          userId,
          channel,
          status,
          providerResponse: providerResponse ?? undefined,
        },
      });
    } catch {
    }
  }

  private isQuietHours(start: string, end: string): boolean {
    try {
      const now = new Date();
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;
      if (startMin > endMin) return nowMin >= startMin || nowMin <= endMin;
      return nowMin >= startMin && nowMin <= endMin;
    } catch {
      return false;
    }
  }
}
