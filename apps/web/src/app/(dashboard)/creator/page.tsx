'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Bot,
  BadgeCheck,
  Eye,
  Sparkles,
  ArrowRight,
  Users,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DashboardPage,
  DashboardBreadcrumbs,
  DashboardPageHeader,
  DashButton,
  DashStatCard,
  DashErrorState,
} from '@/components/dashboard/DashboardPrimitives';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { strategiesApi, type Strategy } from '@/lib/api/strategies';
import { marketplaceApi } from '@/lib/api/marketplace';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { cn } from '@/lib/utils';
import { formatBotName } from '@/lib/bot-labels';

function statusLabel(bot: Strategy) {
  if (bot.isPublished && bot.isVerified) {
    return { text: 'Live on marketplace', className: 'bg-chart-3/10 text-chart-3 border-chart-3/20' };
  }
  if (bot.isVerified || bot.verificationStatus === 'VERIFIED') {
    return { text: 'Approved — ready to publish', className: 'bg-chart-3/10 text-chart-3 border-chart-3/20' };
  }
  if (bot.verificationStatus === 'PENDING') {
    return { text: 'Pending approval', className: 'bg-amber-500/10 text-amber-700 border-amber-500/20' };
  }
  return { text: 'Draft', className: 'bg-muted text-muted-foreground border-[var(--card-border)]' };
}

function reviewHint(bot: Strategy) {
  if (bot.verificationStatus !== 'PENDING') return null;
  if (bot.reviewEndsAt) {
    const ends = new Date(bot.reviewEndsAt);
    const daysLeft = Math.max(0, Math.ceil((ends.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    return daysLeft > 0
      ? `~${daysLeft} day${daysLeft === 1 ? '' : 's'} left in review window`
      : 'Review window complete — awaiting team decision';
  }
  return 'Under 1-week real-market review by Profytron';
}

export default function CreatorStudioPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const createdQuery = useQuery({
    queryKey: ['strategies-created'],
    queryFn: () => strategiesApi.getCreatedStrategies(),
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const marketplaceQuery = useQuery({
    queryKey: ['creator-marketplace-preview', user?.id],
    queryFn: () => marketplaceApi.getMarketplace({ limit: 12, sort: 'newest' }),
    staleTime: 60_000,
  });

  const publishLiveMutation = useMutation({
    mutationFn: (id: string) => strategiesApi.publishLive(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['strategies-created'] }),
        queryClient.invalidateQueries({ queryKey: ['strategies'] }),
        queryClient.invalidateQueries({ queryKey: ['my-strategies'] }),
        queryClient.invalidateQueries({ queryKey: ['my-bots'] }),
        queryClient.invalidateQueries({ queryKey: ['my-bots-count'] }),
        queryClient.invalidateQueries({ queryKey: ['marketplace'] }),
        queryClient.invalidateQueries({ queryKey: ['marketplace-featured'] }),
        queryClient.invalidateQueries({ queryKey: ['creator-marketplace-preview'] }),
      ]);
      toast.success('Bot is live on the marketplace and active in My Bots');
    },
    onError: (error: unknown) => {
      const message =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message ===
          'string'
          ? (error as { response: { data: { message: string } } }).response.data.message
          : 'Could not publish bot';
      toast.error(message);
    },
  });

  const myBots = React.useMemo(() => {
    const data = createdQuery.data;
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
      const nested = data as { items?: Strategy[]; data?: Strategy[] };
      if (Array.isArray(nested.items)) return nested.items;
      if (Array.isArray(nested.data)) return nested.data;
    }
    return [] as Strategy[];
  }, [createdQuery.data]);

  const otherBots = React.useMemo(() => {
    const raw = marketplaceQuery.data;
    const list = Array.isArray(raw)
      ? raw
      : Array.isArray((raw as { items?: unknown[] })?.items)
        ? (raw as { items: unknown[] }).items
        : Array.isArray((raw as { data?: unknown[] })?.data)
          ? (raw as { data: unknown[] }).data
          : [];

    const myBotIds = new Set(myBots.map((bot) => bot.id));
    const myUserId = user?.id;

    return (list as Array<Record<string, unknown>>)
      .filter((item) => {
        const strategy = (item.strategy as Record<string, unknown>) || item;
        const strategyId = String(item.strategyId || strategy.id || item.id || '');
        if (strategyId && myBotIds.has(strategyId)) return false;

        const creator =
          (strategy.creator as { id?: string } | undefined) ||
          (item.creator as { id?: string } | undefined);
        const creatorId =
          creator?.id ||
          (typeof strategy.creatorId === 'string' ? strategy.creatorId : undefined) ||
          (typeof item.creatorId === 'string' ? item.creatorId : undefined);

        if (myUserId && creatorId && creatorId === myUserId) return false;
        return true;
      })
      .slice(0, 6);
  }, [marketplaceQuery.data, myBots, user?.id]);

  const liveCount = myBots.filter((b) => b.isPublished && b.isVerified).length;
  const pendingCount = myBots.filter((b) => b.verificationStatus === 'PENDING').length;
  const totalCopies = myBots.reduce((sum, b) => sum + (b.copiesCount || 0), 0);

  return (
    <DashboardPage>
      <DashboardBreadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Marketplace', href: '/marketplace' },
          { label: 'Creator Studio' },
        ]}
      />

      <DashboardPageHeader
        title="Creator"
        titleAccent="Studio"
        description="Add bots, track review status, and publish approved strategies to the marketplace."
        icon={Sparkles}
        actions={
          <DashButton onClick={() => router.push('/creator/add-bot')} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Bot
          </DashButton>
        }
      />

      <section className="dashboard-card p-5 md:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <UserAvatar name={user?.fullName || user?.email || 'Creator'} size="lg" className="ring-2 ring-primary/20" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-foreground truncate">
                  {user?.fullName || 'Your creator profile'}
                </h2>
                {myBots.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Creator
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground truncate">
                {user?.bio || user?.email || 'Add bots to start building your creator presence.'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <DashButton variant="outline" onClick={() => router.push('/marketplace')} className="gap-2">
              <Eye className="h-4 w-4" />
              View marketplace
            </DashButton>
            <DashButton onClick={() => router.push('/creator/add-bot')} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Bot
            </DashButton>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <DashStatCard label="Your bots" value={String(myBots.length)} hint="Created by you" />
        <DashStatCard label="Live" value={String(liveCount)} hint={`${pendingCount} pending approval`} />
        <DashStatCard label="Total copies" value={String(totalCopies)} hint="Across your bots" />
      </div>

      <section className="dashboard-card p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-foreground">Your bots</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pending bots stay private until Profytron approves and you publish
            </p>
          </div>
          <DashButton variant="outline" onClick={() => router.push('/creator/add-bot')} className="gap-1.5 text-xs px-3 py-1.5">
            <Plus className="h-3.5 w-3.5" />
            Add
          </DashButton>
        </div>

        {createdQuery.isLoading ? (
          <div className="space-y-2 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-muted/40" />
            ))}
          </div>
        ) : createdQuery.isError ? (
          <DashErrorState message="Couldn't load your creator bots." onRetry={() => createdQuery.refetch()} />
        ) : myBots.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--card-border)] bg-muted/20 px-4 py-10 text-center">
            <Bot className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm font-semibold text-foreground">No bots yet</p>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
              Create your first bot with a name, strategy style, expected profit, and markets it trades.
            </p>
            <DashButton onClick={() => router.push('/creator/add-bot')} className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Add your first bot
            </DashButton>
          </div>
        ) : (
          <div className="space-y-2">
            {myBots.map((bot) => {
              const status = statusLabel(bot);
              const hint = reviewHint(bot);
              const config = (bot.configJson || {}) as Record<string, unknown>;
              const profit = typeof config.expectedProfitPct === 'number' ? config.expectedProfitPct : null;
              const markets = Array.isArray(config.markets) ? (config.markets as string[]).join(', ') : null;
              const canPublish =
                (bot.isVerified || bot.verificationStatus === 'VERIFIED') && !bot.isPublished;
              const publishing = publishLiveMutation.isPending && publishLiveMutation.variables === bot.id;

              return (
                <div
                  key={bot.id}
                  className="flex flex-col gap-3 rounded-xl border border-[var(--card-border)] bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">{formatBotName(bot.name)}</p>
                      <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-semibold', status.className)}>
                        {status.text}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{bot.description}</p>
                    {hint && <p className="mt-1 text-[11px] text-amber-700">{hint}</p>}
                    <div className="mt-1.5 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                      <span>{bot.category}</span>
                      <span>Risk {bot.riskLevel}</span>
                      {profit != null && <span className="text-chart-3">~{profit}% target</span>}
                      {markets && <span>{markets}</span>}
                      <span>₹{Number(bot.monthlyPrice || 0).toLocaleString('en-IN')}/mo</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {canPublish && (
                      <DashButton
                        onClick={() => publishLiveMutation.mutate(bot.id)}
                        disabled={publishLiveMutation.isPending}
                        className="gap-1.5 text-xs px-3 py-1.5"
                      >
                        {publishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                        Publish to marketplace
                      </DashButton>
                    )}
                    <DashButton
                      variant="outline"
                      onClick={() => router.push(`/creator/bots/${bot.id}`)}
                      className="gap-1.5 text-xs px-3 py-1.5"
                    >
                      Open
                      <ArrowRight className="h-3.5 w-3.5" />
                    </DashButton>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="dashboard-card p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Bots from other creators
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Latest strategies on the marketplace</p>
          </div>
          <Link href="/marketplace" className="text-xs font-semibold text-primary hover:underline">
            See all
          </Link>
        </div>

        {marketplaceQuery.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-muted/40" />
            ))}
          </div>
        ) : otherBots.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No marketplace bots to show yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {otherBots.map((item) => {
              const strategy = (item.strategy as Record<string, unknown>) || item;
              const id = String(item.strategyId || strategy.id || item.id || '');
              const name = String(strategy.name || item.name || 'Strategy');
              const creator =
                (strategy.creator as { fullName?: string })?.fullName ||
                (item.creator as { fullName?: string })?.fullName ||
                'Creator';
              const price = Number(item.monthlyPrice ?? strategy.monthlyPrice ?? 0);

              return (
                <button
                  key={id || name}
                  type="button"
                  onClick={() => id && router.push(`/marketplace/${id}`)}
                  className="rounded-xl border border-[var(--card-border)] bg-muted/20 p-4 text-left transition-colors hover:border-primary/30 hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground line-clamp-1">{formatBotName(name)}</p>
                    <TrendingUp className="h-4 w-4 text-primary shrink-0" />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{creator}</p>
                  <p className="mt-3 text-sm font-bold text-foreground">
                    {price > 0 ? `₹${price.toLocaleString('en-IN')}/mo` : 'FREE'}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </DashboardPage>
  );
}
