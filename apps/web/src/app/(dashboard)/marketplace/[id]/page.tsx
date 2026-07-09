'use client';

import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
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
import { toast } from 'sonner';

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
          <DashButton variant="outline" onClick={refreshDetail}>
            Refresh
          </DashButton>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <DashMetricTile label="Category" value={strategy.category} />
        <DashMetricTile label="Risk" value={strategy.riskLevel} />
        <DashMetricTile label="Monthly" value={`$${Number(detail?.listing?.monthlyPrice || 0).toFixed(2)}`} />
        <DashMetricTile label="Subscribers" value={strategy.copiesCount} />
      </div>

      <StrategyAnalyticsDashboard strategyId={strategyId} />

      {(detail?.documents?.length ?? 0) > 0 && (
        <DashboardCard className="p-6">
          <DashSectionTitle className="mb-4">Reports & Documents</DashSectionTitle>
          <div className="grid gap-3 md:grid-cols-2">
            {detail.documents.map((doc: {
              id: string;
              title: string;
              description?: string | null;
              downloadUrl: string;
              fileSizeBytes: number;
            }) => (
              <a
                key={doc.id}
                href={doc.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="dashboard-card flex flex-col gap-1 p-4 transition-colors hover:border-primary/30"
              >
                <span className="text-sm font-semibold text-foreground">{doc.title}</span>
                {doc.description && (
                  <span className="text-caption text-muted-foreground line-clamp-2">{doc.description}</span>
                )}
                <span className="text-micro text-primary mt-1">
                  Download PDF · {(doc.fileSizeBytes / 1024 / 1024).toFixed(1)} MB
                </span>
              </a>
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
        <DashSectionTitle className="mb-6">Reviews</DashSectionTitle>

        <div className="space-y-3">
          <label className="text-sm text-muted-foreground">Rating (1-5)</label>
          <input
            type="number"
            min={1}
            max={5}
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="dash-input w-24"
          />
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
              <p className="text-sm font-semibold">
                {review.user?.fullName || 'User'} • {review.rating}/5
              </p>
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
    </DashboardPage>
  );
}
