import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CopySizingMode,
  CopyRelationshipStatus,
  SubscriptionStatus,
} from '@prisma/client';
import type { SetSizingDto, UpsertMasterProfileDto } from './dto/copy.dto';

const DEFAULT_BASE_EQUITY = 10_000;

@Injectable()
export class CopyTradingService implements OnModuleInit {
  private readonly logger = new Logger(CopyTradingService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    try {
      await this.backfillAll();
    } catch (err) {
      this.logger.warn(
        `Initial copy backfill skipped: ${(err as Error).message}`,
      );
    }
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async reconcile() {
    try {
      await this.backfillAll();
    } catch (err) {
      this.logger.warn(`Copy reconcile skipped: ${(err as Error).message}`);
    }
  }

  async backfillAll() {
    const masters = await this.syncMasterProfiles();
    const relationships = await this.syncCopyRelationships();
    this.logger.log(
      `Copy backfill: ${masters} master profile(s), ${relationships} relationship(s)`,
    );
    return { masters, relationships };
  }

  async syncMasterProfiles(): Promise<number> {
    const masterAccounts = await this.prisma.brokerAccount.findMany({
      where: { isMasterSource: true },
      select: { id: true, userId: true, initialEquity: true },
    });
    if (masterAccounts.length === 0) return 0;

    const accountIds = masterAccounts.map((a) => a.id);
    const userIds = masterAccounts.map((a) => a.userId);

    const allTrades = await this.prisma.trade.findMany({
      where: { brokerAccountId: { in: accountIds }, status: 'CLOSED' },
      orderBy: { closedAt: 'asc' },
      select: { brokerAccountId: true, profit: true },
    });
    const profitsByAccount = new Map<string, number[]>();
    for (const t of allTrades) {
      if (!t.brokerAccountId) continue;
      const arr = profitsByAccount.get(t.brokerAccountId) ?? [];
      arr.push(t.profit ?? 0);
      profitsByAccount.set(t.brokerAccountId, arr);
    }

    const strategies = await this.prisma.strategy.findMany({
      where: { masterBrokerAccountId: { in: accountIds } },
      select: { id: true, masterBrokerAccountId: true },
    });
    const strategyIds = strategies.map((s) => s.id);
    const subCounts = strategyIds.length
      ? await this.prisma.userStrategySubscription.groupBy({
          by: ['strategyId'],
          where: {
            status: SubscriptionStatus.ACTIVE,
            strategyId: { in: strategyIds },
          },
          _count: { _all: true },
        })
      : [];
    const countByStrategy = new Map(
      subCounts.map((c) => [c.strategyId, c._count._all]),
    );
    const followersByAccount = new Map<string, number>();
    for (const s of strategies) {
      if (!s.masterBrokerAccountId) continue;
      const prev = followersByAccount.get(s.masterBrokerAccountId) ?? 0;
      followersByAccount.set(
        s.masterBrokerAccountId,
        prev + (countByStrategy.get(s.id) ?? 0),
      );
    }

    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, fullName: true, username: true },
    });
    const userById = new Map(users.map((u) => [u.id, u]));

    let count = 0;
    for (const account of masterAccounts) {
      const stats = this.computeMasterStatsFromProfits(
        profitsByAccount.get(account.id) ?? [],
        account.initialEquity ?? DEFAULT_BASE_EQUITY,
      );
      const followersCount = followersByAccount.get(account.id) ?? 0;
      const user = userById.get(account.userId);
      const fallbackName =
        user?.fullName || user?.username || 'Profytron Trader';

      await this.prisma.masterProfile.upsert({
        where: { userId: account.userId },
        create: {
          userId: account.userId,
          brokerAccountId: account.id,
          displayName: fallbackName,
          ...stats,
          followersCount,
        },
        update: {
          brokerAccountId: account.id,
          ...stats,
          followersCount,
        },
      });
      count++;
    }
    return count;
  }

  async syncCopyRelationships(): Promise<number> {
    const subs = await this.prisma.userStrategySubscription.findMany({
      where: {
        status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAUSED] },
        strategy: { masterBrokerAccountId: { not: null } },
      },
      select: {
        id: true,
        userId: true,
        status: true,
        lotMultiplier: true,
        maxDrawdownPct: true,
        brokerAccountId: true,
        executionProfileJson: true,
        strategy: {
          select: { masterBrokerAccount: { select: { userId: true } } },
        },
      },
    });

    const masterUserIds = [
      ...new Set(
        subs
          .map((sub) => sub.strategy?.masterBrokerAccount?.userId)
          .filter((id): id is string => !!id),
      ),
    ];
    const profiles = masterUserIds.length
      ? await this.prisma.masterProfile.findMany({
          where: { userId: { in: masterUserIds } },
          select: { id: true, userId: true },
        })
      : [];
    const profileIdByUserId = new Map(profiles.map((p) => [p.userId, p.id]));

    let count = 0;
    for (const sub of subs) {
      const masterUserId = sub.strategy?.masterBrokerAccount?.userId;
      if (!masterUserId) continue;
      const masterProfileId = profileIdByUserId.get(masterUserId);
      if (!masterProfileId) continue;

      const profile = (sub.executionProfileJson as any) ?? {};
      const sizingMode = this.toSizingMode(profile.sizingMode);
      const status =
        sub.status === SubscriptionStatus.PAUSED
          ? CopyRelationshipStatus.PAUSED
          : CopyRelationshipStatus.ACTIVE;

      await this.prisma.copyRelationship.upsert({
        where: {
          masterProfileId_followerUserId: {
            masterProfileId,
            followerUserId: sub.userId,
          },
        },
        create: {
          masterProfileId,
          followerUserId: sub.userId,
          subscriptionId: sub.id,
          followerAccountId: sub.brokerAccountId ?? null,
          status,
          sizingMode,
          lotMultiplier: sub.lotMultiplier ?? 1.0,
          fixedLot:
            typeof profile.fixedLot === 'number' ? profile.fixedLot : null,
          maxDrawdownPct: sub.maxDrawdownPct ?? null,
        },
        update: {
          subscriptionId: sub.id,
          followerAccountId: sub.brokerAccountId ?? null,
          status,
          sizingMode,
          lotMultiplier: sub.lotMultiplier ?? 1.0,
          fixedLot:
            typeof profile.fixedLot === 'number' ? profile.fixedLot : null,
          maxDrawdownPct: sub.maxDrawdownPct ?? null,
        },
      });
      count++;
    }
    return count;
  }

  private computeMasterStatsFromProfits(profits: number[], baseEquity: number) {
    if (profits.length === 0) {
      return { roiPct: 0, winRate: 0, maxDrawdownPct: 0, sharpeRatio: 0 };
    }

    const totalProfit = profits.reduce((s, p) => s + p, 0);
    const wins = profits.filter((p) => p > 0).length;
    const winRate = (wins / profits.length) * 100;
    const roiPct = baseEquity > 0 ? (totalProfit / baseEquity) * 100 : 0;

    let peak = baseEquity;
    let running = baseEquity;
    let maxDd = 0;
    for (const p of profits) {
      running += p;
      if (running > peak) peak = running;
      const dd = peak > 0 ? ((peak - running) / peak) * 100 : 0;
      maxDd = Math.max(maxDd, dd);
    }

    const mean = totalProfit / profits.length;
    const variance =
      profits.reduce((s, p) => s + (p - mean) ** 2, 0) / profits.length;
    const std = Math.sqrt(variance);
    const sharpeRatio = std > 0 ? Number((mean / std).toFixed(2)) : 0;

    return {
      roiPct: Number(roiPct.toFixed(2)),
      winRate: Number(winRate.toFixed(2)),
      maxDrawdownPct: Number(maxDd.toFixed(2)),
      sharpeRatio,
    };
  }

  private toSizingMode(value: unknown): CopySizingMode {
    if (value === 'FIXED') return CopySizingMode.FIXED;
    if (value === 'EQUITY_RATIO') return CopySizingMode.EQUITY_RATIO;
    return CopySizingMode.MULTIPLIER;
  }

  async listPublicMasters(limit = 50) {
    return this.prisma.masterProfile.findMany({
      where: { isPublic: true },
      orderBy: [{ isVerified: 'desc' }, { roiPct: 'desc' }],
      take: Math.min(limit, 100),
    });
  }

  async getMaster(id: string) {
    const master = await this.prisma.masterProfile.findUnique({
      where: { id },
    });
    if (!master || !master.isPublic) {
      throw new NotFoundException('Master profile not found');
    }
    return master;
  }

  async getMyMaster(userId: string) {
    return this.prisma.masterProfile.findUnique({ where: { userId } });
  }

  async upsertMyMaster(userId: string, dto: UpsertMasterProfileDto) {
    const masterAccount = await this.prisma.brokerAccount.findFirst({
      where: { userId, isMasterSource: true },
      select: { id: true },
    });

    return this.prisma.masterProfile.upsert({
      where: { userId },
      create: {
        userId,
        brokerAccountId: masterAccount?.id ?? null,
        displayName: dto.displayName,
        bio: dto.bio ?? null,
        strategyDescription: dto.strategyDescription ?? null,
        isPublic: dto.isPublic ?? true,
      },
      update: {
        displayName: dto.displayName,
        bio: dto.bio ?? null,
        strategyDescription: dto.strategyDescription ?? null,
        ...(dto.isPublic !== undefined ? { isPublic: dto.isPublic } : {}),
        ...(masterAccount?.id ? { brokerAccountId: masterAccount.id } : {}),
      },
    });
  }

  async getMyRelationships(userId: string) {
    return this.prisma.copyRelationship.findMany({
      where: { followerUserId: userId },
      include: {
        masterProfile: {
          select: { displayName: true, isVerified: true, roiPct: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async setSizing(userId: string, subscriptionId: string, dto: SetSizingDto) {
    const sub = await this.prisma.userStrategySubscription.findFirst({
      where: { id: subscriptionId, userId },
      select: {
        id: true,
        brokerAccountId: true,
        executionProfileJson: true,
        strategy: {
          select: { masterBrokerAccount: { select: { userId: true } } },
        },
      },
    });
    if (!sub) throw new NotFoundException('Subscription not found');

    const multiplier =
      dto.multiplier != null
        ? Math.min(Math.max(dto.multiplier, 0.01), 5.0)
        : undefined;
    const existingProfile = (sub.executionProfileJson as any) ?? {};

    const updated = await this.prisma.userStrategySubscription.update({
      where: { id: sub.id },
      data: {
        executionProfileJson: {
          ...existingProfile,
          sizingMode: dto.sizingMode,
          ...(dto.fixedLot != null ? { fixedLot: dto.fixedLot } : {}),
        },
        ...(multiplier != null ? { lotMultiplier: multiplier } : {}),
        ...(dto.maxDrawdownPct != null
          ? { maxDrawdownPct: dto.maxDrawdownPct }
          : {}),
      },
      select: { id: true, lotMultiplier: true, executionProfileJson: true },
    });

    const masterUserId = sub.strategy?.masterBrokerAccount?.userId;
    if (masterUserId) {
      const masterProfile = await this.prisma.masterProfile.findUnique({
        where: { userId: masterUserId },
        select: { id: true },
      });
      if (masterProfile) {
        await this.prisma.copyRelationship.upsert({
          where: {
            masterProfileId_followerUserId: {
              masterProfileId: masterProfile.id,
              followerUserId: userId,
            },
          },
          create: {
            masterProfileId: masterProfile.id,
            followerUserId: userId,
            subscriptionId: sub.id,
            followerAccountId: sub.brokerAccountId ?? null,
            sizingMode: this.toSizingMode(dto.sizingMode),
            lotMultiplier: multiplier ?? 1.0,
            fixedLot: dto.fixedLot ?? null,
            maxDrawdownPct: dto.maxDrawdownPct ?? null,
            dailyLossLimitUsd: dto.dailyLossLimitUsd ?? null,
          },
          update: {
            subscriptionId: sub.id,
            followerAccountId: sub.brokerAccountId ?? null,
            sizingMode: this.toSizingMode(dto.sizingMode),
            ...(multiplier != null ? { lotMultiplier: multiplier } : {}),
            fixedLot: dto.fixedLot ?? null,
            ...(dto.maxDrawdownPct != null
              ? { maxDrawdownPct: dto.maxDrawdownPct }
              : {}),
            ...(dto.dailyLossLimitUsd != null
              ? { dailyLossLimitUsd: dto.dailyLossLimitUsd }
              : {}),
          },
        });
      }
    }

    return updated;
  }
}
