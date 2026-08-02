'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  Clock3,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ResultStatus = 'success' | 'failed' | 'pending';

function PaymentResultInner() {
  const searchParams = useSearchParams();
  const raw = (searchParams.get('status') || 'pending').toLowerCase();
  const status: ResultStatus =
    raw === 'success' || raw === 'failed' || raw === 'pending' ? raw : 'pending';
  const plan = searchParams.get('plan');
  const reason = searchParams.get('reason');

  const copy: Record<
    ResultStatus,
    { title: string; body: string; Icon: typeof CheckCircle2; tone: string }
  > = {
    success: {
      title: 'Payment successful',
      body: plan
        ? `Your ${plan} plan is active. You can manage renewals and invoices from Billing Center.`
        : 'Your payment was confirmed. You can manage renewals and invoices from Billing Center.',
      Icon: CheckCircle2,
      tone: 'text-chart-3',
    },
    failed: {
      title: 'Payment failed',
      body:
        reason ||
        'We could not complete this payment. No charge was finalized. You can retry checkout safely.',
      Icon: XCircle,
      tone: 'text-destructive',
    },
    pending: {
      title: 'Payment pending',
      body: 'Checkout was closed before confirmation, or the bank is still processing. If money left your account, refresh Billing in a few minutes or retry only if no charge appears.',
      Icon: Clock3,
      tone: 'text-chart-4',
    },
  };

  const { title, body, Icon, tone } = copy[status];

  return (
    <main className="flex min-h-[70vh] items-center justify-center p-6 sm:p-10">
      <div
        role="status"
        aria-live="polite"
        className="w-full max-w-lg rounded-[var(--radius-card)] border border-[var(--card-border)] bg-card p-8 sm:p-10 shadow-[var(--shadow-card)] text-center"
      >
        <Icon className={cn('mx-auto h-14 w-14', tone)} aria-hidden />
        <h1 className="mt-5 text-2xl font-bold text-foreground tracking-tight">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{body}</p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          {status === 'failed' || status === 'pending' ? (
            <Link href="/billing#billing-plans">
              <Button className="min-h-[44px] w-full sm:w-auto gap-2">
                <RotateCcw className="h-4 w-4" aria-hidden />
                Retry payment
              </Button>
            </Link>
          ) : null}
          <Link href="/billing">
            <Button
              variant={status === 'success' ? 'default' : 'outline'}
              className="min-h-[44px] w-full sm:w-auto"
            >
              Back to Billing Center
            </Button>
          </Link>
          {status === 'success' ? (
            <Link href="/dashboard">
              <Button variant="outline" className="min-h-[44px] w-full sm:w-auto">
                Go to dashboard
              </Button>
            </Link>
          ) : null}
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Need help?{' '}
          <a
            href="mailto:support@profytron.com?subject=Billing%20payment%20result"
            className="font-semibold text-primary hover:underline"
          >
            Contact support
          </a>
        </p>
      </div>
    </main>
  );
}

export default function BillingPaymentResultPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[70vh] items-center justify-center" aria-busy="true">
          <p className="text-sm text-muted-foreground">Loading payment result…</p>
        </main>
      }
    >
      <PaymentResultInner />
    </Suspense>
  );
}
