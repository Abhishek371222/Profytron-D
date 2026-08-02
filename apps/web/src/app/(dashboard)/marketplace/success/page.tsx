'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthBrandScene } from '@/components/3d/AuthBrandScene';

/**
 * Marketplace Stripe success. Prefer canonical /billing/result for platform plans.
 * Kept for Stripe success_url compatibility.
 */
function MarketplaceSuccessInner() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  React.useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReduced) {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  }, []);

  return (
    <main className="animate-page-in flex min-h-[70vh] items-center justify-center p-8">
      <div
        className="w-full max-w-xl premium-surface p-10 text-center"
        role="status"
        aria-live="polite"
      >
        <div className="mb-4 flex justify-center">
          <AuthBrandScene />
        </div>
        <CheckCircle2 className="mx-auto h-16 w-16 text-chart-3" aria-hidden />
        <h1 className="mt-6 text-3xl font-bold text-foreground">Subscription activated!</h1>
        <p className="mt-2 text-foreground/70">
          Your marketplace strategy is now active. Invoices (if issued) appear in Billing Center.
        </p>
        {sessionId && (
          <p className="mt-3 text-xs text-foreground/40">Session: {sessionId}</p>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/my-bots">
            <Button className="bg-primary text-primary-foreground hover:brightness-110 min-h-[44px]">
              Go to My Bots
            </Button>
          </Link>
          <Link href="/billing">
            <Button variant="outline" className="min-h-[44px]">
              Billing Center
            </Button>
          </Link>
          <Link href="/marketplace">
            <Button variant="outline" className="min-h-[44px]">
              Marketplace
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function MarketplaceSuccessPage() {
  return (
    <Suspense fallback={<main className="min-h-screen w-full bg-background" aria-busy="true" />}>
      <MarketplaceSuccessInner />
    </Suspense>
  );
}
