'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

function MarketplaceSuccessInner() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  React.useEffect(() => {
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.6 },
    });
  }, []);

  return (
    <main className="flex min-h-[70vh] items-center justify-center p-8">
      <div className="w-full max-w-xl premium-surface p-10 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-chart-3" />
        <h1 className="mt-6 text-3xl font-bold text-foreground">Subscription activated!</h1>
        <p className="mt-2 text-foreground/70">
          Your marketplace strategy is now active.
        </p>
        {sessionId && (
          <p className="mt-3 text-xs text-foreground/40">Session: {sessionId}</p>
        )}

        <div className="mt-8 flex justify-center gap-4">
          <Link href="/strategies">
            <Button className="bg-primary text-primary-foreground hover:brightness-110">Go to My Strategies</Button>
          </Link>
          <Link href="/marketplace">
            <Button variant="outline">Back to Marketplace</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function MarketplaceSuccessPage() {
  return (
    <Suspense fallback={<main className="min-h-screen w-full bg-background" />}>
      <MarketplaceSuccessInner />
    </Suspense>
  );
}
