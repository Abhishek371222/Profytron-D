'use client';

import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Star } from 'lucide-react';
import { marketplaceApi } from '@/lib/api/marketplace';
import {
  DashboardPage,
  DashboardBreadcrumbs,
  DashboardPageHeader,
  DashboardCard,
  DashMetricTile,
  DashSectionTitle,
  DashButton,
} from '@/components/dashboard/DashboardPrimitives';
import { formatBotDescription, formatBotName } from '@/lib/bot-labels';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { SubscribeModal } from '@/components/marketplace/SubscribeModal';

function ReviewStarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  const [hovered, setHovered] = React.useState<number | null>(null);
  const preview = hovered ?? value;

  return (
    <div
      className="flex items-center gap-1.5"
      onMouseLeave={() => setHovered(null)}
      role="radiogroup"
      aria-label="Rating"
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const active = preview >= star;
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
            onMouseEnter={() => setHovered(star)}
            onFocus={() => setHovered(star)}
            onClick={() => onChange(star)}
            className="rounded-md p-0.5 transition-transform duration-150 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <Star
              className={cn(
                'h-7 w-7 transition-colors duration-150',
                active
                  ? hovered !== null && hovered !== value
                    ? 'fill-primary/55 text-primary/70'
                    : 'fill-primary text-primary'
                  : 'fill-transparent text-foreground/25',
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

// Heavy recharts-based analytics panel — defer it so the strategy detail route
// doesn't ship the charting bundle until this section actually renders.
const StrategyAnalyticsDashboard = dynamic(
  () =>
    import('@/components/marketplace/StrategyAnalyticsDashboard').then(
      (m) => m.StrategyAnalyticsDashboard,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-80 animate-pulse rounded-xl border border-[var(--card-border)] bg-muted/40" />
    ),
  },
);

export default function MarketplaceStrategyDetailPage() {
  const params = useParams<{ id: string }>();
  const strategyId = params?.id;
  const queryClient = useQueryClient();

  const [rating, setRating] = React.useState(5);
  const [reviewText, setReviewText] = React.useState('');
  const [subscribeOpen, setSubscribeOpen] = React.useState(false);

  const strategyQuery = useQuery({
    queryKey: ['marketplace-strategy', strategyId],
    queryFn: () => marketplaceApi.getStrategy(strategyId),
    enabled: Boolean(strategyId),
  });

  const reviewsQuery = useInfiniteQuery({
    queryKey: ['marketplace-reviews', strategyId],
    queryFn: ({ pageParam }) =>
      marketplaceApi.getReviews(strategyId, {
        reviewsPage: pageParam,
        reviewsLimit: 10,
      }),
    initialPageParam: 1,
    enabled: Boolean(strategyId),
    getNextPageParam: (lastPage, allPages) => {
      const total = Number(lastPage?.total || 0);
      const loaded = allPages.length * 10;
      return loaded < total ? allPages.length + 1 : undefined;
    },
  });

  const createReviewMutation = useMutation({
    mutationFn: () =>
      marketplaceApi.createReview(strategyId, {
        rating: Math.min(5, Math.max(1, Number(rating) || 1)),
        reviewText,
      }),
    onSuccess: () => {
      toast.success('Review submitted');
      setReviewText('');
      setRating(5);
      queryClient.invalidateQueries({ queryKey: ['marketplace-reviews', strategyId] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-strategy', strategyId] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || error?.response?.data?.message || 'Failed to submit review');
    },
  });

  const strategyStatus = (strategyQuery.error as any)?.response?.status;
  const isStrategyNotFound = strategyStatus === 404;
  const isStrategyTransientError = strategyQuery.isError && !isStrategyNotFound;

  React.useEffect(() => {
    // Only warn about a transient outage — a real 404 shows a dedicated state.
    if (isStrategyTransientError) {
      toast.error('Strategy details unavailable', {
        description: 'The marketplace API is recovering — retrying automatically.',
      });
    }
  }, [isStrategyTransientError]);

  React.useEffect(() => {
    // Don't nag about reviews when the strategy itself failed/was not found.
    if (reviewsQuery.isError && !strategyQuery.isError) {
      toast.error('Reviews feed unavailable', {
        description: 'Review history may be incomplete until sync recovers.',
      });
    }
  }, [reviewsQuery.isError, strategyQuery.isError]);

  const refreshDetail = () => {
    queryClient.invalidateQueries({ queryKey: ['marketplace-strategy', strategyId] });
    queryClient.invalidateQueries({ queryKey: ['marketplace-reviews', strategyId] });
    queryClient.invalidateQueries({ queryKey: ['marketplace-analytics', strategyId] });
    toast.success('Marketplace detail refresh queued');
  };

  if (strategyQuery.isLoading) {
    return (
      <DashboardPage>
        <div className="h-40 animate-pulse rounded-[var(--radius-card)] bg-muted" />
      </DashboardPage>
    );
  }

  const detail = strategyQuery.data;
  const strategy = detail?.strategy;
  const reviews = reviewsQuery.data?.pages.flatMap((page: any) => page.items || []) || [];

  // Transient failure (network / API restart / 5xx): offer a retry instead of
  // implying the strategy doesn't exist.
  if (isStrategyTransientError) {
    return (
      <DashboardPage>
        <DashboardBreadcrumbs items={[{ label: 'Marketplace', href: '/marketplace' }, { label: 'Strategy' }]} />
        <DashboardCard className="py-12 text-center">
          <DashSectionTitle className="mb-2">Couldn't load this strategy</DashSectionTitle>
          <p className="mx-auto mb-6 max-w-md text-sm text-muted-foreground">
            The marketplace API is temporarily unavailable. Try again in a moment.
          </p>
          <DashButton variant="primary" onClick={() => strategyQuery.refetch()} disabled={strategyQuery.isFetching}>
            {strategyQuery.isFetching ? 'Retrying…' : 'Try again'}
          </DashButton>
        </DashboardCard>
      </DashboardPage>
    );
  }

  if (!strategy) {
    return (
      <DashboardPage>
        <DashboardBreadcrumbs items={[{ label: 'Marketplace', href: '/marketplace' }, { label: 'Not found' }]} />
        <DashboardCard className="py-12 text-center">
          <DashSectionTitle className="mb-2">Strategy not found</DashSectionTitle>
          <p className="mx-auto mb-6 max-w-md text-sm text-muted-foreground">
            This strategy may have been unpublished or removed from the marketplace.
          </p>
          <Link href="/marketplace">
            <DashButton variant="primary">Browse marketplace</DashButton>
          </Link>
        </DashboardCard>
      </DashboardPage>
    );
  }

  const displayName = formatBotName(strategy.name);
  const displayDescription = formatBotDescription(strategy.description);
  const config = (strategy.configJson || {}) as Record<string, unknown>;
  const strategyStyle =
    typeof config.strategyStyle === 'string' ? config.strategyStyle : null;
  const markets = Array.isArray(config.markets)
    ? (config.markets as string[]).join(', ')
    : null;
  const timeframe = typeof config.timeframe === 'string' ? config.timeframe : null;
  const monthlyPrice = Number(
    detail?.listing?.monthlyPrice ?? strategy.monthlyPrice ?? 0,
  );

  return (
    <DashboardPage>
      <DashboardBreadcrumbs
        items={[
          { label: 'Marketplace', href: '/marketplace' },
          { label: displayName },
        ]}
      />

      <DashboardPageHeader
        title={displayName}
        description={displayDescription}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/copy-trading">
              <DashButton variant="outline">Copy Trading</DashButton>
            </Link>
            <Link href="/my-bots">
              <DashButton variant="outline">My Bots</DashButton>
            </Link>
            <DashButton variant="outline" onClick={refreshDetail}>
              Refresh
            </DashButton>
          </div>
        }
      />

      <DashboardCard className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Ready to copy this strategy?</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Subscribe to activate it on your MT5, then manage copy settings under Copy Trading.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <DashButton variant="primary" onClick={() => setSubscribeOpen(true)}>
            Subscribe / Activate
          </DashButton>
          <Link href="/copy-trading">
            <DashButton variant="outline">Open Copy Trading</DashButton>
          </Link>
        </div>
      </DashboardCard>

      <div className="grid gap-4 md:grid-cols-4">
        <DashMetricTile label="Category" value={strategy.category} />
        <DashMetricTile label="Risk" value={strategy.riskLevel} />
        <DashMetricTile
          label="Monthly"
          value={monthlyPrice > 0 ? `₹${monthlyPrice.toLocaleString('en-IN')}` : 'FREE'}
        />
        <DashMetricTile label="Subscribers" value={strategy.copiesCount} />
      </div>

      {(strategyStyle || markets || timeframe) && (
        <DashboardCard className="p-6">
          <DashSectionTitle className="mb-4">Strategy details</DashSectionTitle>
          <div className="grid gap-3 sm:grid-cols-3 text-sm">
            {strategyStyle && (
              <div>
                <p className="text-xs text-muted-foreground">Strategy</p>
                <p className="mt-1 font-medium text-foreground">{strategyStyle}</p>
              </div>
            )}
            {timeframe && (
              <div>
                <p className="text-xs text-muted-foreground">Timeframe</p>
                <p className="mt-1 font-medium text-foreground">{timeframe}</p>
              </div>
            )}
            {markets && (
              <div>
                <p className="text-xs text-muted-foreground">Markets</p>
                <p className="mt-1 font-medium text-foreground">{markets}</p>
              </div>
            )}
          </div>
        </DashboardCard>
      )}

      <StrategyAnalyticsDashboard strategyId={strategyId} />

      {(detail?.documents?.length ?? 0) > 0 && (
        <DashboardCard className="p-6">
          <DashSectionTitle className="mb-4">Strategy assets</DashSectionTitle>
          {(() => {
            const docs = detail.documents as Array<{
              id: string;
              title: string;
              description?: string | null;
              downloadUrl: string;
              fileSizeBytes: number;
              kind?: string;
              mimeType?: string;
            }>;
            const images = docs.filter((d) => d.kind === 'IMAGE' || d.mimeType?.startsWith('image/'));
            const pdfs = docs.filter((d) => d.kind === 'PDF' || d.mimeType === 'application/pdf');
            const dataFiles = docs.filter(
              (d) => d.kind === 'DATA' || (!images.includes(d) && !pdfs.includes(d)),
            );
            const sizeLabel = (bytes: number) =>
              bytes >= 1024 * 1024
                ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
                : `${Math.max(1, Math.round(bytes / 1024))} KB`;

            return (
              <div className="space-y-6">
                {images.length > 0 && (
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Images
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {images.map((doc) => (
                        <a
                          key={doc.id}
                          href={doc.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="overflow-hidden rounded-xl border border-[var(--card-border)] bg-muted/20 transition-colors hover:border-primary/30"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={doc.downloadUrl}
                            alt={doc.title}
                            className="h-40 w-full object-cover"
                          />
                          <div className="p-3">
                            <p className="text-sm font-semibold text-foreground line-clamp-1">{doc.title}</p>
                            <p className="text-micro text-muted-foreground mt-0.5">{sizeLabel(doc.fileSizeBytes)}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {pdfs.length > 0 && (
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      PDF documents
                    </p>
                    <div className="grid gap-3 md:grid-cols-2">
                      {pdfs.map((doc) => (
                        <a
                          key={doc.id}
                          href={doc.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="dashboard-card flex flex-col gap-1 p-4 transition-colors hover:border-primary/30"
                        >
                          <span className="text-sm font-semibold text-foreground">{doc.title}</span>
                          {doc.description && (
                            <span className="text-caption text-muted-foreground line-clamp-2">
                              {doc.description}
                            </span>
                          )}
                          <span className="text-micro text-primary mt-1">
                            View PDF · {sizeLabel(doc.fileSizeBytes)}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {dataFiles.length > 0 && (
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Data files
                    </p>
                    <div className="grid gap-3 md:grid-cols-2">
                      {dataFiles.map((doc) => (
                        <a
                          key={doc.id}
                          href={doc.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="dashboard-card flex flex-col gap-1 p-4 transition-colors hover:border-primary/30"
                        >
                          <span className="text-sm font-semibold text-foreground">{doc.title}</span>
                          {doc.description && (
                            <span className="text-caption text-muted-foreground line-clamp-2">
                              {doc.description}
                            </span>
                          )}
                          <span className="text-micro text-primary mt-1">
                            Download data · {sizeLabel(doc.fileSizeBytes)}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </DashboardCard>
      )}

      <DashboardCard className="p-6">
        <DashSectionTitle className="mb-4">Country Usage</DashSectionTitle>
        <div className="grid gap-3 md:grid-cols-2">
          {(detail?.countryStats || []).map((entry: { country: string; count: number }) => (
            <div key={entry.country} className="dashboard-card p-3 text-sm">
              {entry.country}: {entry.count}
            </div>
          ))}
          {(!detail?.countryStats || detail.countryStats.length === 0) && (
            <p className="text-sm text-muted-foreground">No country usage data yet.</p>
          )}
        </div>
      </DashboardCard>

      <DashboardCard className="p-6">
        <DashSectionTitle className="mb-6">Reviews</DashSectionTitle>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Rating</p>
            <ReviewStarRating value={rating} onChange={setRating} />
          </div>
          <textarea
            placeholder="Share your strategy review"
            value={reviewText}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReviewText(e.target.value)}
            className="dash-input min-h-24 w-full resize-y"
          />
          <DashButton
            variant="primary"
            onClick={() => createReviewMutation.mutate()}
            disabled={createReviewMutation.isPending || !reviewText.trim()}
          >
            {createReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
          </DashButton>
        </div>

        <div className="mt-8 space-y-4">
          {reviews.map((review: { id: string; user?: { fullName?: string }; rating: number; reviewText: string; creatorReply?: string }) => (
            <div key={review.id} className="dashboard-card p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">{review.user?.fullName || 'User'}</p>
                <div className="flex items-center gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        'h-3.5 w-3.5',
                        review.rating >= star
                          ? 'fill-primary text-primary'
                          : 'fill-transparent text-foreground/20',
                      )}
                    />
                  ))}
                </div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{review.reviewText}</p>
              {review.creatorReply && (
                <p className="mt-3 text-sm text-primary">Creator reply: {review.creatorReply}</p>
              )}
            </div>
          ))}

          {reviews.length === 0 && !reviewsQuery.isLoading && (
            <p className="text-sm text-muted-foreground">No reviews yet. Be the first to submit one.</p>
          )}

          {reviewsQuery.hasNextPage && (
            <DashButton variant="outline" onClick={() => reviewsQuery.fetchNextPage()}>
              Load more reviews
            </DashButton>
          )}
        </div>
      </DashboardCard>

      <SubscribeModal
        strategy={{
          id: strategy.id,
          name: displayName,
          monthlyPrice,
          annualPrice: Number(detail?.listing?.annualPrice ?? strategy.annualPrice ?? 0),
          lifetimePrice: Number(detail?.listing?.lifetimePrice ?? strategy.lifetimePrice ?? 0),
          category: strategy.category,
        }}
        isOpen={subscribeOpen}
        onClose={() => setSubscribeOpen(false)}
      />
    </DashboardPage>
  );
}
