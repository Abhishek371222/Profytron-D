'use client';

import React from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { marketplaceApi } from '@/lib/api/marketplace';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

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
      toast.error(error?.response?.data?.message || 'Failed to submit review');
    },
  });

  React.useEffect(() => {
    if (strategyQuery.isError) {
      toast.error('Strategy details unavailable', {
        description: 'Try refreshing while the marketplace API recovers.',
      });
    }
  }, [strategyQuery.isError]);

  React.useEffect(() => {
    if (reviewsQuery.isError) {
      toast.error('Reviews feed unavailable', {
        description: 'Review history may be incomplete until sync recovers.',
      });
    }
  }, [reviewsQuery.isError]);

  const refreshDetail = () => {
    queryClient.invalidateQueries({ queryKey: ['marketplace-strategy', strategyId] });
    queryClient.invalidateQueries({ queryKey: ['marketplace-reviews', strategyId] });
    toast.success('Marketplace detail refresh queued');
  };

  if (strategyQuery.isLoading) {
    return <div className="p-8 text-white/70">Loading strategy...</div>;
  }

  const detail = strategyQuery.data;
  const strategy = detail?.strategy;
  const reviews = reviewsQuery.data?.pages.flatMap((page: any) => page.items || []) || [];

  if (!strategy) {
    return <div className="p-8 text-white/70">Strategy not found.</div>;
  }

  return (
    <main className="space-y-8 p-8 text-white">
      <section className="rounded-3xl border border-white/10 bg-[#0d0d12] p-6">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-3xl font-bold">{strategy.name}</h1>
          <Button variant="outline" onClick={refreshDetail}>Refresh</Button>
        </div>
        <p className="mt-2 text-white/70">{strategy.description}</p>
        <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-white/50">
          Reviews status: <span className={reviewsQuery.isError ? 'text-amber-300' : 'text-emerald-300'}>{reviewsQuery.isError ? 'Fallback risk' : 'Live'}</span>
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase text-white/50">Category</p>
            <p className="mt-1 text-sm font-semibold">{strategy.category}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase text-white/50">Risk</p>
            <p className="mt-1 text-sm font-semibold">{strategy.riskLevel}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase text-white/50">Monthly</p>
            <p className="mt-1 text-sm font-semibold">${Number(detail?.listing?.monthlyPrice || 0).toFixed(2)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase text-white/50">Subscribers</p>
            <p className="mt-1 text-sm font-semibold">{strategy.copiesCount}</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#0d0d12] p-6">
        <h2 className="text-xl font-bold">Country Usage</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {(detail?.countryStats || []).map((entry: any) => (
            <div key={entry.country} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
              {entry.country}: {entry.count}
            </div>
          ))}
          {(!detail?.countryStats || detail.countryStats.length === 0) && (
            <p className="text-white/60">No country usage data yet.</p>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#0d0d12] p-6">
        <h2 className="text-xl font-bold">Reviews</h2>

        <div className="mt-6 space-y-3">
          <label className="text-sm text-white/70">Rating (1-5)</label>
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
            className="min-h-24 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
          />
          <Button onClick={() => createReviewMutation.mutate()} disabled={createReviewMutation.isPending || !reviewText.trim()}>
            {createReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
          </Button>
        </div>

        <div className="mt-8 space-y-4">
          {reviews.map((review: any) => (
            <div key={review.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold">{review.user?.fullName || 'User'} • {review.rating}/5</p>
              <p className="mt-2 text-sm text-white/80">{review.reviewText}</p>
              {review.creatorReply && <p className="mt-3 text-sm text-indigo-300">Creator reply: {review.creatorReply}</p>}
            </div>
          ))}

          {reviews.length === 0 && !reviewsQuery.isLoading && (
            <p className="text-sm text-white/60">No reviews yet. Be the first to submit one.</p>
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
