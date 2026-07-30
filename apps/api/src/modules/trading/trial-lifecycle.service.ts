import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RedisService } from '../auth/redis.service';
import { AgentEventService } from '../agents/agent-event.service';
import { AGENT_EVENTS } from '../agents/agent.types';

function dayWindow(daysFromNow: number): { start: Date; end: Date } {
  const start = new Date();
  start.setDate(start.getDate() + daysFromNow);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

@Injectable()
export class TrialLifecycleService {
  private readonly logger = new Logger(TrialLifecycleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly notifications: NotificationsService,
    private readonly redis: RedisService,
    private readonly agentEvents: AgentEventService,
  ) {}

  private async alreadySent(userId: string, campaign: string) {
    return Boolean(await this.redis.get(`trial:${campaign}:${userId}`));
  }

  private async markSent(userId: string, campaign: string) {
    await this.redis.set(`trial:${campaign}:${userId}`, '1', 60 * 60 * 24 * 10);
  }

  private async sendReminder(daysLeft: 3 | 1) {
    const { start, end } = dayWindow(daysLeft);
    const campaign = daysLeft === 3 ? 'ending3d' : 'ending1d';

    const trials = await this.prisma.userSubscription.findMany({
      where: {
        isTrial: true,
        status: 'ACTIVE',
        trialEndsAt: { gte: start, lte: end },
      },
      include: {
        user: { select: { id: true, email: true, fullName: true } },
        plan: { select: { name: true } },
      },
    });

    let sent = 0;
    for (const sub of trials) {
      if (!sub.trialEndsAt) continue;
      if (await this.alreadySent(sub.userId, campaign)) continue;

      await this.markSent(sub.userId, campaign);

      await this.email
        .sendTrialEndingSoonEmail(
          sub.user.email,
          sub.user.fullName,
          sub.plan.name,
          daysLeft,
          sub.trialEndsAt,
          sub.userId,
        )
        .catch(() => undefined);

      await this.notifications
        .create(
          sub.userId,
          'Trial Ending Soon',
          `Your ${sub.plan.name} trial ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Upgrade to keep your access.`,
          'WARNING',
          '/settings/billing',
        )
        .catch(() => undefined);

      void this.agentEvents.emit({
        type: AGENT_EVENTS.TRIAL_ENDING_SOON,
        entityType: 'subscription',
        entityId: sub.id,
        userId: sub.userId,
        payload: { planName: sub.plan.name, daysLeft },
        idempotencyKey: `trial-ending-${campaign}:${sub.id}`,
      });

      sent++;
    }

    if (sent) {
      this.logger.log(`Trial "${daysLeft} day(s) left" reminder sent to ${sent} user(s)`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendTrialEndingReminders() {
    await this.sendReminder(3);
    await this.sendReminder(1);
  }
}
