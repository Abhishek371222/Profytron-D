import { OnQueueFailed, Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { EmailService } from '../email/email.service';
import { FcmService } from './fcm.service';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../prisma/prisma.service';

interface DispatchJob {
  userId: string;
  notificationId?: string;
  title: string;
  body: string;
  actionUrl?: string;
  sendEmail: boolean;
  sendPush: boolean;
  category: string;
  priority: string;
}

@Processor('notifications_dispatch')
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private emailService: EmailService,
    private fcmService: FcmService,
    private notificationsService: NotificationsService,
    private prisma: PrismaService,
  ) {}

  @Process({
    name: 'dispatch_notification',
    concurrency: Number(process.env.NOTIFICATION_QUEUE_CONCURRENCY) || 10,
  })
  async handle(job: Job<DispatchJob>) {
    const {
      userId,
      notificationId,
      title,
      body,
      actionUrl,
      sendEmail,
      sendPush,
      category,
    } = job.data;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, fullName: true },
    });

    if (sendEmail && user) {
      try {
        await this.emailService.sendNotificationEmail(
          user.email,
          user.fullName,
          title,
          body,
          actionUrl,
          userId,
        );
        void this.notificationsService.logDelivery(
          notificationId ?? null,
          userId,
          'EMAIL',
          'SENT',
        );
      } catch (err) {
        void this.notificationsService.logDelivery(
          notificationId ?? null,
          userId,
          'EMAIL',
          'FAILED',
          { error: (err as Error).message },
        );
        this.logger.error(
          `Email dispatch failed for user ${userId}: ${(err as Error).message}`,
        );
        throw err;
      }
    }

    if (sendPush) {
      try {
        await this.fcmService.sendToUser(userId, title, body, {
          category,
          ...(actionUrl ? { actionUrl } : {}),
          ...(notificationId ? { notificationId } : {}),
        });
        void this.notificationsService.logDelivery(
          notificationId ?? null,
          userId,
          'PUSH',
          'SENT',
        );
      } catch (err) {
        void this.notificationsService.logDelivery(
          notificationId ?? null,
          userId,
          'PUSH',
          'FAILED',
          { error: (err as Error).message },
        );
        this.logger.warn(
          `FCM dispatch failed for user ${userId}: ${(err as Error).message}`,
        );
      }
    }
  }

  @OnQueueFailed()
  onFailed(job: Job<DispatchJob>, err: Error) {
    if (job.attemptsMade >= (job.opts.attempts ?? 1)) {
      this.logger.error(
        `Notification dispatch DEAD-LETTERED after ${job.attemptsMade} attempts ` +
          `(user ${job.data?.userId}, notification ${job.data?.notificationId ?? 'n/a'}): ${err.message}`,
      );
    }
  }
}
