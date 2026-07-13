'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CheckCircle2, CreditCard, History, Zap } from '@/components/ui/icons';
import { Button, buttonVariants } from '@/components/ui/button';
import { subscriptionsApi, type SubscriptionPlan } from '@/lib/api/subscriptions';
import { RazorpaySubscriptionButton } from '@/components/payments/RazorpaySubscriptionButton';
import { formatInr } from '@/lib/pricing/plans';
import { trackEvent, ACTIVATION_EVENTS } from '@/lib/analytics/track';
import { SettingsSection } from '@/components/settings/SettingsUi';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false);

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
  const isCancelled = Boolean(current?.cancelledAt);

  const cancelMutation = useMutation({
    mutationFn: () => subscriptionsApi.cancel(),
    onSuccess: () => {
      toast.success('Subscription cancelled. You’ll keep access until your current period ends.');
      setCancelDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['subscription-current'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to cancel subscription');
    },
  });

  const refreshBilling = () => {
    void queryClient.invalidateQueries({ queryKey: ['subscription-current'] });
    void queryClient.invalidateQueries({ queryKey: ['subscription-invoices'] });
    void queryClient.invalidateQueries({ queryKey: ['subscription-payments'] });
  };

  return (
    <div className="space-y-6 pb-20">
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="space-y-6 rounded-[var(--radius-card)] border border-[var(--card-border)] bg-card p-5 shadow-[var(--shadow-card)]"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Billing & Plans</h1>
              <p className="text-sm text-foreground/40">
                {activePlanName
                  ? isCancelled
                    ? `${activePlanName} — cancelled, access continues until period end`
                    : `Active plan: ${activePlanName}`
                  : 'You are on the Free plan — upgrade for live copy trading'}
              </p>
            </div>
          </div>
          {activePlanName && !isCancelled && (
            <button
              type="button"
              onClick={() => setCancelDialogOpen(true)}
              className="shrink-0 text-xs font-semibold text-foreground/40 hover:text-destructive"
            >
              Cancel plan
            </button>
          )}
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
                  ? 'bg-primary text-primary-foreground'
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
          {plans.map((plan, idx) => {
            const isActive = activePlanId === plan.id || activePlanName === plan.name;
            const price =
              billingCycle === 'ANNUAL'
                ? plan.annualPrice ?? plan.monthlyPrice * 12
                : plan.monthlyPrice;
            const features = parseFeatures(plan.features);

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.3, ease: 'easeOut' }}
                whileHover={{ y: -4 }}
                className={cn(
                  'p-6 rounded-2xl border flex flex-col transition-shadow duration-300 hover:shadow-[var(--shadow-card-hover)]',
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
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      <SettingsSection title="Wallet & deposits" delay={0.05}>
        <div className="flex items-center gap-3 mb-2">
          <CreditCard className="w-5 h-5 text-foreground/40" />
        </div>
        <p className="text-sm text-foreground/50">
          Fund your wallet for marketplace strategy subscriptions. UPI, cards, and netbanking via Razorpay.
        </p>
        <Link
          href="/wallet"
          className={cn(buttonVariants({ variant: 'outline' }), 'mt-3')}
        >
          Go to Wallet
        </Link>
      </SettingsSection>

      <SettingsSection title="Invoice history" delay={0.1}>
        <div className="flex items-center gap-3 mb-2">
          <History className="w-5 h-5 text-foreground/40" />
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
                }, idx: number) => (
                  <motion.tr
                    key={inv.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="border-t border-border hover:bg-muted/30 transition-colors"
                  >
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
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </SettingsSection>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel your subscription?</DialogTitle>
            <DialogDescription>
              You&apos;ll keep full access to {activePlanName} until your current billing period ends. After that, your account moves to the Free plan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Keep plan
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? 'Cancelling...' : 'Cancel subscription'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
