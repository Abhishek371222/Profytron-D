'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MarketplaceSuccessPage() {
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
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#0d0d12] p-10 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-400" />
        <h1 className="mt-6 text-3xl font-bold text-white">Subscription activated!</h1>
        <p className="mt-2 text-white/70">
          Your marketplace strategy is now active.
        </p>
        {sessionId && (
          <p className="mt-3 text-xs text-white/40">Session: {sessionId}</p>
        )}

        <div className="mt-8 flex justify-center gap-4">
          <Link href="/strategies">
            <Button className="bg-white text-black hover:bg-white/90">Go to My Strategies</Button>
          </Link>
          <Link href="/marketplace">
            <Button variant="outline">Back to Marketplace</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
