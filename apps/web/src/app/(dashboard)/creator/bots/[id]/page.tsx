'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, FileText, ImageIcon, Database, Star, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
  DashboardPage,
  DashboardBreadcrumbs,
  DashboardPageHeader,
  DashboardCard,
  DashMetricTile,
  DashSectionTitle,
  DashButton,
  DashErrorState,
} from '@/components/dashboard/DashboardPrimitives';
import { strategiesApi, type StrategyDocument } from '@/lib/api/strategies';
import { marketplaceApi } from '@/lib/api/marketplace';
import { formatBotDescription, formatBotName } from '@/lib/bot-labels';
import { cn } from '@/lib/utils';

type BotStatusInfo = {
  isPublished?: boolean;
  isVerified?: boolean;
  verificationStatus?: string;
  reviewStartedAt?: string | null;
};

function statusLabel(bot: BotStatusInfo) {
  if (bot.isPublished && bot.isVerified) {
    return { text: 'Live on marketplace', className: 'bg-chart-3/10 text-chart-3 border-chart-3/20' };
  }
  if (bot.isVerified || bot.verificationStatus === 'VERIFIED') {
    return { text: 'Approved — ready to publish', className: 'bg-chart-3/10 text-chart-3 border-chart-3/20' };
  }
  if (bot.verificationStatus === 'PENDING') {
    return { text: 'Pending approval', className: 'bg-amber-500/10 text-amber-700 border-amber-500/20' };
  }
  // The verification enum has no distinct "rejected" value — a rejection
  // resets status to UNVERIFIED. A bot that was previously submitted
  // (reviewStartedAt is set) but is neither verified nor pending again has
  // been rejected, not merely never-submitted, so it gets its own label.
  if (bot.reviewStartedAt && !bot.isVerified) {
    return { text: 'Changes requested', className: 'bg-destructive/10 text-destructive border-destructive/20' };
  }
  return { text: 'Draft', className: 'bg-muted text-muted-foreground border-[var(--card-border)]' };
}

function formatDate(iso?: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function sizeLabel(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default function CreatorBotDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const botId = params?.id;
  const [replyDrafts, setReplyDrafts] = React.useState<Record<string, string>>({});

  const botQuery = useQuery({
    queryKey: ['creator-bot', botId],
    queryFn: () => strategiesApi.getStrategy(botId),
    enabled: Boolean(botId),
  });

  const docsQuery = useQuery({
    queryKey: ['creator-bot-docs', botId],
    queryFn: () => strategiesApi.listDocuments(botId),
    enabled: Boolean(botId),
  });

  const reviewsQuery = useQuery({
    queryKey: ['creator-bot-reviews', botId],
    queryFn: () => marketplaceApi.getReviews(botId, { reviewsLimit: 50 }),
    enabled: Boolean(botId),
  });

  const replyMutation = useMutation({
    mutationFn: ({ reviewId, replyText }: { reviewId: string; replyText: string }) =>
      marketplaceApi.replyToReview(reviewId, replyText),
    onSuccess: (_data, variables) => {
      toast.success('Reply posted');
      setReplyDrafts((prev) => {
        const next = { ...prev };
        delete next[variables.reviewId];
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ['creator-bot-reviews', botId] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.error || error?.response?.data?.message || 'Could not post reply',
      );
    },
  });

  const resubmitMutation = useMutation({
    mutationFn: () => strategiesApi.publishStrategy(botId),
    onSuccess: () => {
      toast.success('Resubmitted for review');
      queryClient.invalidateQueries({ queryKey: ['creator-bot', botId] });
      queryClient.invalidateQueries({ queryKey: ['strategies-created'] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.error || error?.response?.data?.message || 'Could not resubmit',
      );
    },
  });

  if (botQuery.isLoading) {
    return (
      <DashboardPage>
        <div className="space-y-4" aria-busy="true" aria-label="Loading bot details">
          <div className="h-10 w-2/3 animate-pulse rounded-[var(--radius-card)] bg-muted/40" />
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-[var(--radius-card)] bg-muted/40" />
            ))}
          </div>
          <div className="h-40 animate-pulse rounded-[var(--radius-card)] bg-muted/40" />
        </div>
      </DashboardPage>
    );
  }

  if (botQuery.isError || !botQuery.data) {
    return (
      <DashboardPage>
        <DashboardBreadcrumbs
          items={[
            { label: 'Creator Studio', href: '/creator' },
            { label: 'Bot' },
          ]}
        />
        <DashErrorState
          message="Couldn't load this bot. It may have been removed or you may not own it."
          onRetry={() => botQuery.refetch()}
        />
      </DashboardPage>
    );
  }

  const bot = botQuery.data;
  const status = statusLabel(bot);
  const config = (bot.configJson || {}) as Record<string, unknown>;
  const strategyStyle =
    typeof config.strategyStyle === 'string' ? config.strategyStyle : null;
  const markets = Array.isArray(config.markets)
    ? (config.markets as string[]).join(', ')
    : null;
  const timeframe = typeof config.timeframe === 'string' ? config.timeframe : null;
  const profit =
    typeof config.expectedProfitPct === 'number' ? config.expectedProfitPct : null;

  const docs: StrategyDocument[] = Array.isArray(docsQuery.data)
    ? docsQuery.data
    : [];
  const images = docs.filter((d) => d.kind === 'IMAGE' || d.mimeType?.startsWith('image/'));
  const pdfs = docs.filter((d) => d.kind === 'PDF' || d.mimeType === 'application/pdf');
  const dataFiles = docs.filter(
    (d) => d.kind === 'DATA' || (!images.includes(d) && !pdfs.includes(d)),
  );

  const displayName = formatBotName(bot.name);
  const displayDescription = formatBotDescription(bot.description);

  return (
    <DashboardPage>
      <DashboardBreadcrumbs
        items={[
          { label: 'Marketplace', href: '/marketplace' },
          { label: 'Creator Studio', href: '/creator' },
          { label: displayName },
        ]}
      />

      <DashboardPageHeader
        title={displayName}
        description={displayDescription}
        actions={
          <div className="flex flex-wrap gap-2">
            <DashButton variant="outline" onClick={() => router.push('/creator')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </DashButton>
            {bot.isPublished && (
              <Link href={`/marketplace/${bot.id}`}>
                <DashButton variant="outline">View on marketplace</DashButton>
              </Link>
            )}
            {status.text === 'Changes requested' && (
              <DashButton
                onClick={() => resubmitMutation.mutate()}
                disabled={resubmitMutation.isPending}
                className="gap-2"
              >
                {resubmitMutation.isPending ? 'Resubmitting…' : 'Resubmit for Review'}
              </DashButton>
            )}
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <span className={cn('rounded-full border px-2.5 py-0.5 text-xs font-semibold', status.className)}>
          {status.text}
        </span>
        {bot.verificationStatus === 'PENDING' && (
          <span className="text-xs text-amber-700">
            Not visible to the public until Profytron approves and you publish.
          </span>
        )}
        {status.text === 'Changes requested' && (
          <span className="text-xs text-destructive">
            Not approved yet — see the review notes below, then resubmit.
          </span>
        )}
      </div>

      {(bot.reviewStartedAt || bot.reviewNotes) && (
        <DashboardCard className="p-5">
          <DashSectionTitle className="mb-3">Review timeline</DashSectionTitle>
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            {bot.reviewStartedAt && (
              <div>
                <p className="text-xs text-muted-foreground">Submitted for review</p>
                <p className="mt-1 font-medium text-foreground">{formatDate(bot.reviewStartedAt)}</p>
              </div>
            )}
            {bot.reviewEndsAt && (
              <div>
                <p className="text-xs text-muted-foreground">
                  {status.text === 'Pending approval' ? 'Review ends' : 'Review ended'}
                </p>
                <p className="mt-1 font-medium text-foreground">{formatDate(bot.reviewEndsAt)}</p>
              </div>
            )}
          </div>
          {bot.reviewNotes && (
            <div className="mt-3 rounded-xl border border-[var(--card-border)] bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Notes from Profytron</p>
              <p className="mt-1 text-sm text-foreground">{bot.reviewNotes}</p>
            </div>
          )}
        </DashboardCard>
      )}

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <DashMetricTile label="Category" value={bot.category} />
        <DashMetricTile label="Risk" value={bot.riskLevel} />
        <DashMetricTile
          label="Monthly"
          value={
            Number(bot.monthlyPrice || 0) > 0
              ? `₹${Number(bot.monthlyPrice).toLocaleString('en-IN')}`
              : 'FREE'
          }
        />
        <DashMetricTile
          label="Target"
          value={profit != null ? `~${profit}%` : '—'}
        />
        <DashMetricTile label="Subscribers" value={String(bot.copiesCount ?? 0)} />
        <DashMetricTile
          label="Earned"
          value={`₹${Number(bot.totalRevenue ?? 0).toLocaleString('en-IN')}`}
        />
      </div>

      <DashboardCard className="p-6">
        <DashSectionTitle className="mb-4">Strategy details</DashSectionTitle>
        <div className="grid gap-4 sm:grid-cols-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Strategy it follows</p>
            <p className="mt-1 font-medium text-foreground">{strategyStyle || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Timeframe</p>
            <p className="mt-1 font-medium text-foreground">{timeframe || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Markets</p>
            <p className="mt-1 font-medium text-foreground">{markets || '—'}</p>
          </div>
        </div>
        <div className="mt-5">
          <p className="text-xs text-muted-foreground">Description</p>
          <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">{displayDescription}</p>
        </div>
      </DashboardCard>

      <DashboardCard className="p-6">
        <DashSectionTitle className="mb-4">Strategy assets</DashSectionTitle>
        {docsQuery.isLoading ? (
          <div className="h-24 animate-pulse rounded-[var(--radius-card)] bg-muted/40" />
        ) : docs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No images, PDFs, or data files uploaded yet.</p>
        ) : (
          <div className="space-y-6">
            {images.length > 0 && (
              <div>
                <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <ImageIcon className="h-3.5 w-3.5" />
                  Images
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {images.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="overflow-hidden rounded-xl border border-[var(--card-border)] bg-muted/20 transition-colors hover:border-primary/30 outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={doc.downloadUrl}
                        alt={doc.title}
                        className="h-40 w-full object-cover"
                      />
                      <div className="p-3">
                        <p className="text-sm font-semibold text-foreground line-clamp-1">{doc.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {sizeLabel(doc.fileSizeBytes)}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {pdfs.length > 0 && (
              <div>
                <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  PDF documents
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  {pdfs.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="dashboard-card flex flex-col gap-1 p-4 transition-colors hover:border-primary/30 outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      <span className="text-sm font-semibold text-foreground">{doc.title}</span>
                      <span className="text-[11px] text-primary mt-1">
                        View PDF · {sizeLabel(doc.fileSizeBytes)}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {dataFiles.length > 0 && (
              <div>
                <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Database className="h-3.5 w-3.5" />
                  Data files
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  {dataFiles.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="dashboard-card flex flex-col gap-1 p-4 transition-colors hover:border-primary/30 outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      <span className="text-sm font-semibold text-foreground">{doc.title}</span>
                      <span className="text-[11px] text-primary mt-1">
                        Download data · {sizeLabel(doc.fileSizeBytes)}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DashboardCard>

      <DashboardCard className="p-6">
        <DashSectionTitle className="mb-4">Reviews</DashSectionTitle>
        {reviewsQuery.isLoading ? (
          <div className="space-y-3" aria-busy="true" aria-label="Loading reviews">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="dashboard-card h-20 animate-pulse p-4" />
            ))}
          </div>
        ) : reviewsQuery.isError ? (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-center">
            <p className="text-sm text-foreground">Reviews couldn't be loaded.</p>
            <DashButton
              variant="outline"
              className="mt-3"
              onClick={() => reviewsQuery.refetch()}
              disabled={reviewsQuery.isFetching}
            >
              {reviewsQuery.isFetching ? 'Retrying…' : 'Try again'}
            </DashButton>
          </div>
        ) : (() => {
          const reviews: Array<{
            id: string;
            user?: { fullName?: string };
            rating: number;
            reviewText: string;
            creatorReply?: string | null;
            createdAt?: string;
          }> = reviewsQuery.data?.items ?? [];

          if (reviews.length === 0) {
            return <p className="text-sm text-muted-foreground">No reviews yet for this bot.</p>;
          }

          return (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="dashboard-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{review.user?.fullName || 'User'}</p>
                      <span className="inline-flex items-center gap-1 rounded-full bg-chart-3/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-chart-3">
                        <ShieldCheck className="h-3 w-3" />
                        Verified subscriber
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {review.createdAt && (
                        <span className="text-[11px] text-muted-foreground">{formatDate(review.createdAt)}</span>
                      )}
                      <div className="flex items-center gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            aria-hidden
                            className={cn(
                              'h-3.5 w-3.5',
                              review.rating >= star ? 'fill-primary text-primary' : 'fill-transparent text-foreground/20',
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{review.reviewText}</p>

                  {review.creatorReply ? (
                    <p className="mt-3 text-sm text-primary">Your reply: {review.creatorReply}</p>
                  ) : (
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <input
                        type="text"
                        placeholder="Reply to this review…"
                        aria-label={`Reply to ${review.user?.fullName || 'this'}'s review`}
                        value={replyDrafts[review.id] ?? ''}
                        onChange={(e) =>
                          setReplyDrafts((prev) => ({ ...prev, [review.id]: e.target.value }))
                        }
                        className="dash-input flex-1"
                      />
                      <DashButton
                        variant="outline"
                        disabled={!replyDrafts[review.id]?.trim() || replyMutation.isPending}
                        onClick={() =>
                          replyMutation.mutate({
                            reviewId: review.id,
                            replyText: replyDrafts[review.id].trim(),
                          })
                        }
                      >
                        {replyMutation.isPending ? 'Posting…' : 'Reply'}
                      </DashButton>
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })()}
      </DashboardCard>
    </DashboardPage>
  );
}
