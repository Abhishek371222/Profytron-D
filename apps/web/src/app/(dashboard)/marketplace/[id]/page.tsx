'use client';

import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { marketplaceApi } from '@/lib/api/marketplace';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    return <div className="p-8 text-foreground/70">Loading strategy...</div>;
  }

  const detail = strategyQuery.data;
  const strategy = detail?.strategy;
  const reviews = reviewsQuery.data?.pages.flatMap((page: any) => page.items || []) || [];

  // Transient failure (network / API restart / 5xx): offer a retry instead of
  // implying the strategy doesn't exist.
  if (isStrategyTransientError) {
    return (
      <main className="space-y-6 p-6 md:p-8 text-foreground">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 text-caption font-bold uppercase tracking-[0.2em] text-foreground/35 hover:text-foreground/70 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Marketplace
        </Link>
        <div className="premium-surface flex flex-col items-center gap-4 p-12 text-center">
          <h1 className="text-xl font-bold">Couldn’t load this strategy</h1>
          <p className="max-w-md text-foreground/70">
            The marketplace API is temporarily unavailable. This is usually brief —
            try again in a moment.
          </p>
          <Button
            onClick={() => strategyQuery.refetch()}
            disabled={strategyQuery.isFetching}
          >
            {strategyQuery.isFetching ? 'Retrying…' : 'Try again'}
          </Button>
        </div>
      </main>
    );
  }

  if (!strategy) {
    return (
      <main className="space-y-6 p-6 md:p-8 text-foreground">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 text-caption font-bold uppercase tracking-[0.2em] text-foreground/35 hover:text-foreground/70 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Marketplace
        </Link>
        <div className="premium-surface flex flex-col items-center gap-4 p-12 text-center">
          <h1 className="text-xl font-bold">Strategy not found</h1>
          <p className="max-w-md text-foreground/70">
            This strategy may have been unpublished or removed from the marketplace.
          </p>
          <Link href="/marketplace">
            <Button>Browse marketplace</Button>
          </Link>
        </div>
      </main>
    );
  }

  const displayName = formatBotName(strategy.name);
  const displayDescription = formatBotDescription(strategy.description);

  return (
    <main className="space-y-8 p-6 md:p-8 text-foreground">
      <div className="flex items-center gap-3">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 text-caption font-bold uppercase tracking-[0.2em] text-foreground/35 hover:text-foreground/70 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Marketplace
        </Link>
      </div>

      <section className="premium-surface p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">{displayName}</h1>
            <p className="mt-2 text-foreground/70 max-w-3xl">{displayDescription}</p>
          </div>
          <Button variant="outline" onClick={refreshDetail}>Refresh</Button>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-border bg-foreground/5 p-4">
            <p className="text-xs uppercase text-foreground/50">Category</p>
            <p className="mt-1 text-sm font-semibold">{strategy.category}</p>
          </div>
          <div className="rounded-xl border border-border bg-foreground/5 p-4">
            <p className="text-xs uppercase text-foreground/50">Risk</p>
            <p className="mt-1 text-sm font-semibold">{strategy.riskLevel}</p>
          </div>
          <div className="rounded-xl border border-border bg-foreground/5 p-4">
            <p className="text-xs uppercase text-foreground/50">Monthly</p>
            <p className="mt-1 text-sm font-semibold">${Number(detail?.listing?.monthlyPrice || 0).toFixed(2)}</p>
          </div>
          <div className="rounded-xl border border-border bg-foreground/5 p-4">
            <p className="text-xs uppercase text-foreground/50">Subscribers</p>
            <p className="mt-1 text-sm font-semibold">{strategy.copiesCount}</p>
          </div>
        </div>
      </section>

      <StrategyAnalyticsDashboard strategyId={strategyId} />

      <section className="premium-surface p-6">
        <h2 className="text-xl font-bold">Country Usage</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {(detail?.countryStats || []).map((entry: any) => (
            <div key={entry.country} className="rounded-xl border border-border bg-foreground/5 p-3 text-sm">
              {entry.country}: {entry.count}
            </div>
          ))}
          {(!detail?.countryStats || detail.countryStats.length === 0) && (
            <p className="text-foreground/60">No country usage data yet.</p>
          )}
        </div>
      </section>

      <section className="premium-surface p-6">
        <h2 className="text-xl font-bold">Reviews</h2>

        <div className="mt-6 space-y-3">
          <label className="text-sm text-foreground/70">Rating (1-5)</label>
          <Input
            type="number"
            min={1}
            max={5}
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="w-24"
          />
          <textarea
            placeholder="Share your strategy review"
            value={reviewText}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReviewText(e.target.value)}
            className="min-h-24 rounded-xl border border-border bg-foreground/5 px-3 py-2 text-sm text-foreground outline-none"
          />
          <Button onClick={() => createReviewMutation.mutate()} disabled={createReviewMutation.isPending || !reviewText.trim()}>
            {createReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
          </Button>
        </div>

        <div className="mt-8 space-y-4">
          {reviews.map((review: any) => (
            <div key={review.id} className="rounded-xl border border-border bg-foreground/5 p-4">
              <p className="text-sm font-semibold">{review.user?.fullName || 'User'} • {review.rating}/5</p>
              <p className="mt-2 text-sm text-foreground/80">{review.reviewText}</p>
              {review.creatorReply && <p className="mt-3 text-sm text-primary">Creator reply: {review.creatorReply}</p>}
            </div>
          ))}

          {reviews.length === 0 && !reviewsQuery.isLoading && (
            <p className="text-sm text-foreground/60">No reviews yet. Be the first to submit one.</p>
          )}

          {reviewsQuery.hasNextPage && (
            <Button variant="outline" onClick={() => reviewsQuery.fetchNextPage()}>
              Load more reviews
            </Button>
          )}
        </div>
      </section>
    </main>
  );
}
