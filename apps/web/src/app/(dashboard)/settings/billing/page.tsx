'use client';

import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { CheckCircle2, CreditCard, History, Zap } from '@/components/ui/icons';
import { Button, buttonVariants } from '@/components/ui/button';
import { subscriptionsApi, type SubscriptionPlan } from '@/lib/api/subscriptions';
import { RazorpaySubscriptionButton } from '@/components/payments/RazorpaySubscriptionButton';
import { formatInr } from '@/lib/pricing/plans';
import { trackEvent, ACTIVATION_EVENTS } from '@/lib/analytics/track';
import Link from 'next/link';

function parseFeatures(features: SubscriptionPlan['features']): string[] {
  if (Array.isArray(features)) return features.map(String);
  return [];
}

export default function BillingPage() {
  const queryClient = useQueryClient();
  const [billingCycle, setBillingCycle] = React.useState<'MONTHLY' | 'ANNUAL'>(
    'MONTHLY',
  );

  const plansQuery = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => subscriptionsApi.getPlans(),
  });

  const currentQuery = useQuery({
    queryKey: ['subscription-current'],
    queryFn: () => subscriptionsApi.getCurrent(),
  });

  const invoicesQuery = useQuery({
    queryKey: ['subscription-invoices'],
    queryFn: () => subscriptionsApi.getInvoices(),
  });

  const plans = (plansQuery.data ?? []).filter((p) => p.monthlyPrice >= 0);
  const current = currentQuery.data;
  const activePlanId = current?.planId ?? current?.plan?.id;
  const activePlanName = current?.plan?.name;

  const refreshBilling = () => {
    void queryClient.invalidateQueries({ queryKey: ['subscription-current'] });
    void queryClient.invalidateQueries({ queryKey: ['subscription-invoices'] });
    void queryClient.invalidateQueries({ queryKey: ['subscription-payments'] });
  };

  return (
    <div className="space-y-12 pb-20">
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Billing & Plans</h1>
            <p className="text-sm text-foreground/40">
              {activePlanName
                ? `Active plan: ${activePlanName}`
                : 'You are on the Free plan — upgrade for live copy trading'}
            </p>
          </div>
        </div>

        <div className="inline-flex rounded-full border border-border bg-foreground/5 p-1">
          {(['MONTHLY', 'ANNUAL'] as const).map((cycle) => (
            <button
              key={cycle}
              type="button"
              onClick={() => setBillingCycle(cycle)}
              className={cn(
                'px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-widest transition-colors',
                billingCycle === cycle
                  ? 'bg-primary text-foreground'
                  : 'text-foreground/50 hover:text-foreground',
              )}
            >
              {cycle === 'MONTHLY' ? 'Monthly' : 'Annual (2 mo free)'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {plansQuery.isLoading && (
            <div className="col-span-3 text-foreground/40 text-sm">Loading plans…</div>
          )}
          {plans.map((plan) => {
            const isActive = activePlanId === plan.id || activePlanName === plan.name;
            const price =
              billingCycle === 'ANNUAL'
                ? plan.annualPrice ?? plan.monthlyPrice * 12
                : plan.monthlyPrice;
            const features = parseFeatures(plan.features);

            return (
              <div
                key={plan.id}
                className={cn(
                  'p-6 rounded-2xl border flex flex-col',
                  isActive
                    ? 'border-primary/40 bg-primary/10'
                    : 'border-border bg-muted/2',
                )}
              >
                {isActive && (
                  <span className="inline-flex items-center gap-1 text-micro font-bold uppercase tracking-widest text-primary mb-3">
                    <CheckCircle2 className="w-3 h-3" /> Current plan
                  </span>
                )}
                <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {plan.monthlyPrice === 0 ? 'Free' : formatInr(price)}
                  {plan.monthlyPrice > 0 && (
                    <span className="text-sm font-normal text-foreground/40">
                      /{billingCycle === 'ANNUAL' ? 'yr' : 'mo'}
                    </span>
                  )}
                </p>
                <p className="text-sm text-foreground/50 mt-2 flex-1">
                  {plan.description}
                </p>
                <ul className="mt-4 space-y-1.5 mb-6">
                  {features.slice(0, 4).map((f) => (
                    <li key={f} className="text-xs text-foreground/60">
                      · {f}
                    </li>
                  ))}
                </ul>
                {plan.monthlyPrice === 0 ? (
                  isActive ? (
                    <Button variant="outline" disabled className="w-full">
                      Current plan
                    </Button>
                  ) : (
                    <Link
                      href="/dashboard"
                      className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}
                    >
                      Continue on Free
                    </Link>
                  )
                ) : (
                  <RazorpaySubscriptionButton
                    planId={plan.id}
                    planName={plan.name}
                    billingCycle={billingCycle}
                    disabled={isActive}
                    className="w-full"
                    onSuccess={() => {
                      trackEvent(ACTIVATION_EVENTS.PLAN_SELECTED, {
                        planId: plan.id,
                        planName: plan.name,
                      });
                      refreshBilling();
                    }}
                  >
                    {isActive ? 'Current plan' : `Upgrade to ${plan.name}`}
                  </RazorpaySubscriptionButton>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <CreditCard className="w-5 h-5 text-foreground/40" />
          <h2 className="text-lg font-semibold text-foreground">Wallet & deposits</h2>
        </div>
        <p className="text-sm text-foreground/50">
          Fund your wallet for marketplace strategy subscriptions. UPI, cards, and netbanking via Razorpay.
        </p>
        <Link
          href="/wallet"
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          Go to Wallet
        </Link>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <History className="w-5 h-5 text-foreground/40" />
          <h2 className="text-lg font-semibold text-foreground">Invoice history</h2>
        </div>
        <div className="rounded-xl border border-border overflow-hidden">
          {(invoicesQuery.data ?? []).length === 0 ? (
            <p className="p-6 text-sm text-foreground/40">No invoices yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/2 text-foreground/40 text-xs uppercase tracking-widest">
                <tr>
                  <th className="text-left p-4">Invoice</th>
                  <th className="text-left p-4">Date</th>
                  <th className="text-left p-4">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(invoicesQuery.data ?? []).map((inv: {
                  id: string;
                  invoiceNumber?: string;
                  issuedAt?: string;
                  total?: number;
                }) => (
                  <tr key={inv.id} className="border-t border-border">
                    <td className="p-4 font-mono text-foreground/80">
                      {inv.invoiceNumber ?? inv.id.slice(0, 8)}
                    </td>
                    <td className="p-4 text-foreground/50">
                      {inv.issuedAt
                        ? new Date(inv.issuedAt).toLocaleDateString('en-IN')
                        : '—'}
                    </td>
                    <td className="p-4 text-foreground">
                      {formatInr(inv.total ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
