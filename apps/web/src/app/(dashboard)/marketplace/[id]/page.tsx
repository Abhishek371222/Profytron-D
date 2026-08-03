'use client';

import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { RefreshCw, Star, ShieldCheck, FileQuestion, ChevronDown } from 'lucide-react';
import { marketplaceApi, SubscriptionBillingModel } from '@/lib/api/marketplace';
import { FAQ_ITEMS } from '@/lib/seo/faq-items';
import {
  DashboardPage,
  DashboardBreadcrumbs,
  DashboardPageHeader,
  DashboardCard,
  DashMetricTile,
  DashSectionTitle,
  DashButton,
} from '@/components/dashboard/DashboardPrimitives';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { formatBotDescription, formatBotName } from '@/lib/bot-labels';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { SubscribeModal } from '@/components/marketplace/SubscribeModal';
import { DashboardSceneStrip } from '@/components/3d/DashboardSceneStrip';

function formatReviewDate(iso?: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

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

// A small, purchase-relevant subset of the site's real FAQ content — not
// per-strategy data (none exists), but genuine, already-published answers
// that matter at the point of subscribing, not invented for this page.
const PURCHASE_FAQ_QUESTIONS = [
  'Is my money safe? Where are my funds held?',
  'How does copy trading work on Profytron?',
  'Is there a free trial?',
  'Can I cancel my subscription at any time?',
  'How is a strategy\'s performance verified?',
  'What payment methods are accepted?',
];
const PURCHASE_FAQ_ITEMS = FAQ_ITEMS.filter((item) => PURCHASE_FAQ_QUESTIONS.includes(item.question));

type ReviewSort = 'newest' | 'highest' | 'lowest';

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
  const [billingModel, setBillingModel] = React.useState<SubscriptionBillingModel>('FIXED');
  const [reviewSort, setReviewSort] = React.useState<ReviewSort>('newest');

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

  const category = strategyQuery.data?.strategy?.category as string | undefined;
  const relatedQuery = useQuery({
    queryKey: ['marketplace-related', category, strategyId],
    queryFn: () => marketplaceApi.getMarketplace({ category, limit: 5 }),
    enabled: Boolean(category),
    staleTime: 60_000,
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
    if (isStrategyTransientError) {
      toast.error('Strategy details unavailable', {
        description: 'The marketplace API is recovering — retrying automatically.',
      });
    }
  }, [isStrategyTransientError]);

  React.useEffect(() => {
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
        <div className="space-y-4" aria-busy="true" aria-label="Loading strategy">
          <div className="h-10 w-2/3 animate-pulse rounded-[var(--radius-card)] bg-muted/40" />
          <div className="h-24 animate-pulse rounded-[var(--radius-card)] bg-muted/40" />
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-[var(--radius-card)] bg-muted/40" />
            ))}
          </div>
          <div className="h-80 animate-pulse rounded-[var(--radius-card)] bg-muted/40" />
        </div>
      </DashboardPage>
    );
  }

  const detail = strategyQuery.data;
  const strategy = detail?.strategy;
  const reviews = reviewsQuery.data?.pages.flatMap((page: any) => page.items || []) || [];
  const sortedReviews = [...reviews].sort((a: any, b: any) => {
    if (reviewSort === 'highest') return b.rating - a.rating;
    if (reviewSort === 'lowest') return a.rating - b.rating;
    return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
  });
  const relatedStrategies = (relatedQuery.data?.items ?? [])
    .filter((item: any) => item.strategyId !== strategyId)
    .slice(0, 4);

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
  const creator = strategy.creator as
    | { fullName?: string; avatarUrl?: string; bio?: string; country?: string }
    | undefined;
  const creatorName = creator?.fullName;
  const isVerified = Boolean(strategy.isVerified);
  const lastUpdated = formatReviewDate(strategy.updatedAt);
  const onMarketplaceSince = formatReviewDate(strategy.createdAt);
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
      <DashboardSceneStrip
        sceneKey="productMarketplace"
        className="mb-4"
        label="Marketplace product"
      />
      <DashboardBreadcrumbs
        items={[
          { label: 'Marketplace', href: '/marketplace' },
          { label: displayName },
        ]}
      />

      <DashboardPageHeader
        title={displayName}
        description={
          creatorName ? (
            <>
              By {creatorName}
              {isVerified && (
                <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wide text-primary">
                  <ShieldCheck className="h-3 w-3" />
                  Verified strategy
                </span>
              )}
              {displayDescription ? <> · {displayDescription}</> : null}
            </>
          ) : (
            displayDescription
          )
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/get-bots">
              <DashButton variant="outline">Bot Plans</DashButton>
            </Link>
            <Link href="/my-bots">
              <DashButton variant="outline">My Bots</DashButton>
            </Link>
            <DashButton variant="icon" onClick={refreshDetail} aria-label="Refresh">
              <RefreshCw className="h-4 w-4" />
            </DashButton>
          </div>
        }
      />

      <DashboardCard className="flex flex-col gap-3 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Ready to copy this strategy?</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Buy a fixed subscription or use profit sharing to activate it on your MT5.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Broker required: a connected MT4/MT5 account (live or paper trading).
          </p>
        </div>
        <div className="grid w-full grid-cols-1 gap-2 min-[420px]:grid-cols-2 lg:flex lg:w-auto lg:flex-wrap lg:justify-end">
          <DashButton
            variant="primary"
            className="w-full min-w-0 justify-center lg:w-auto"
            onClick={() => {
              setBillingModel('FIXED');
              setSubscribeOpen(true);
            }}
          >
            <span className="truncate">Buy Subscription</span>
          </DashButton>
          <DashButton
            variant="outline"
            className="w-full min-w-0 justify-center lg:w-auto"
            onClick={() => {
              setBillingModel('PROFIT_SHARE');
              setSubscribeOpen(true);
            }}
          >
            <span className="truncate sm:hidden">Profit Share · ₹149</span>
            <span className="hidden truncate sm:inline">Get Profit Sharing · ₹149</span>
          </DashButton>
          <Link href="/get-bots" className="min-[420px]:col-span-2 lg:col-span-1">
            <DashButton variant="outline" className="w-full lg:w-auto">
              Open Bot Plans
            </DashButton>
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

      {creatorName && (
        <DashboardCard className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <UserAvatar name={creatorName} src={creator?.avatarUrl} size="md" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="text-sm font-semibold text-foreground">{creatorName}</p>
                  {isVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                      <ShieldCheck className="h-3 w-3" />
                      Verified creator
                    </span>
                  )}
                </div>
                {creator?.bio ? (
                  <p className="mt-0.5 max-w-md text-xs text-muted-foreground line-clamp-2">{creator.bio}</p>
                ) : (
                  <p className="mt-0.5 text-xs text-muted-foreground">Strategy creator</p>
                )}
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-4 text-xs text-muted-foreground sm:text-right">
              {onMarketplaceSince && (
                <div>
                  <p className="text-[10px] uppercase tracking-wide">On marketplace since</p>
                  <p className="mt-0.5 font-medium text-foreground">{onMarketplaceSince}</p>
                </div>
              )}
              {lastUpdated && (
                <div>
                  <p className="text-[10px] uppercase tracking-wide">Last updated</p>
                  <p className="mt-0.5 font-medium text-foreground">{lastUpdated}</p>
                </div>
              )}
            </div>
          </div>
        </DashboardCard>
      )}

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
      <p className="-mt-2 text-xs text-muted-foreground">
        Past performance is historical and does not guarantee future results. Figures reflect this
        strategy's recorded trade history on Profytron, not a simulation.
      </p>

      <DashboardCard className="p-6">
        <DashSectionTitle className="mb-4">Strategy assets</DashSectionTitle>
        {(detail?.documents?.length ?? 0) === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <FileQuestion className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No documentation provided yet for this strategy.
            </p>
          </div>
        ) : (() => {
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
                          className="dashboard-card flex flex-col gap-1 p-4 transition-colors hover:border-primary/30 outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
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
                          className="dashboard-card flex flex-col gap-1 p-4 transition-colors hover:border-primary/30 outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
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

      {PURCHASE_FAQ_ITEMS.length > 0 && (
        <DashboardCard className="p-6">
          <DashSectionTitle className="mb-4">Frequently asked questions</DashSectionTitle>
          <div className="divide-y divide-[var(--card-border)]">
            {PURCHASE_FAQ_ITEMS.map((item) => (
              <details key={item.question} className="group py-3 first:pt-0 last:pb-0">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-md">
                  {item.question}
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
              </details>
            ))}
          </div>
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
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <DashSectionTitle>Reviews</DashSectionTitle>
          {reviews.length > 1 && (
            <div className="relative">
              <select
                value={reviewSort}
                onChange={(e) => setReviewSort(e.target.value as ReviewSort)}
                aria-label="Sort reviews by"
                className="h-[var(--control-h-sm)] min-h-[var(--touch-min)] appearance-none rounded-[var(--radius-button)] border border-[var(--card-border)] bg-card py-0 pl-3 pr-8 text-xs font-semibold text-muted-foreground outline-none transition-colors hover:text-foreground focus:border-[color-mix(in_srgb,var(--primary)_40%,var(--card-border))]"
              >
                <option value="newest">Newest first</option>
                <option value="highest">Highest rated</option>
                <option value="lowest">Lowest rated</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Rating</p>
            <ReviewStarRating value={rating} onChange={setRating} />
          </div>
          <textarea
            placeholder="Share your strategy review"
            aria-label="Your review"
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
          {reviewsQuery.isLoading && (
            <div className="space-y-3" aria-busy="true" aria-label="Loading reviews">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="dashboard-card h-20 animate-pulse p-4" />
              ))}
            </div>
          )}

          {reviewsQuery.isError && (
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
          )}

          {!reviewsQuery.isLoading &&
            !reviewsQuery.isError &&
            sortedReviews.map((review: {
              id: string;
              user?: { fullName?: string };
              rating: number;
              reviewText: string;
              creatorReply?: string;
              createdAt?: string;
            }) => (
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
                      <span className="text-[11px] text-muted-foreground">{formatReviewDate(review.createdAt)}</span>
                    )}
                    <div className="flex items-center gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          aria-hidden
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
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{review.reviewText}</p>
                {review.creatorReply && (
                  <p className="mt-3 text-sm text-primary">Creator reply: {review.creatorReply}</p>
                )}
              </div>
            ))}

          {!reviewsQuery.isLoading && !reviewsQuery.isError && reviews.length === 0 && (
            <p className="text-sm text-muted-foreground">No reviews yet. Be the first to submit one.</p>
          )}

          {reviewsQuery.hasNextPage && (
            <DashButton variant="outline" onClick={() => reviewsQuery.fetchNextPage()}>
              Load more reviews
            </DashButton>
          )}
        </div>
      </DashboardCard>

      {relatedStrategies.length > 0 && (
        <DashboardCard className="p-6">
          <DashSectionTitle className="mb-4">More in {strategy.category}</DashSectionTitle>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {relatedStrategies.map((item: any) => {
              const relatedStrategy = item.strategy ?? {};
              const relatedPrice = Number(item.monthlyPrice || relatedStrategy.monthlyPrice || 0);
              return (
                <Link
                  key={item.strategyId}
                  href={`/marketplace/${item.strategyId}`}
                  className="dashboard-card flex flex-col gap-1 p-4 transition-colors hover:border-primary/30 outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <p className="truncate text-sm font-semibold text-foreground">
                    {formatBotName(String(relatedStrategy.name || 'Strategy'))}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(relatedStrategy.creator as { fullName?: string })?.fullName || 'Unknown creator'}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-primary">
                    {relatedPrice > 0 ? `₹${relatedPrice.toLocaleString('en-IN')}/mo` : 'FREE'}
                  </p>
                </Link>
              );
            })}
          </div>
        </DashboardCard>
      )}

      {/* Mobile-only persistent purchase bar — keeps the primary CTA reachable
          without scrolling back to the top on a long product page. */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-[var(--card-border)] bg-card/95 px-4 py-3 backdrop-blur-xl lg:hidden"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">Monthly</p>
          <p className="text-sm font-bold text-foreground">
            {monthlyPrice > 0 ? `₹${monthlyPrice.toLocaleString('en-IN')}` : 'FREE'}
          </p>
        </div>
        <DashButton
          variant="primary"
          className="shrink-0"
          onClick={() => {
            setBillingModel('FIXED');
            setSubscribeOpen(true);
          }}
        >
          Subscribe
        </DashButton>
      </div>
      <div className="h-16 lg:hidden" aria-hidden />

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
        initialBillingModel={billingModel}
        onClose={() => setSubscribeOpen(false)}
      />
    </DashboardPage>
  );
}
