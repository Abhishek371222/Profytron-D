'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { copyTradingApi } from '@/lib/api/copy-trading';
import { brokerApi } from '@/lib/api/broker';
import { marketplaceApi, SubscriptionBillingModel } from '@/lib/api/marketplace';
import { BrokerConnectModal } from '@/components/copy-trading/BrokerConnectModal';
import { BrokerAccountsPanel } from '@/components/copy-trading/BrokerAccountsPanel';
import { CopySettingsSheet } from '@/components/copy-trading/CopySettingsSheet';
import { SubscribeModal } from '@/components/marketplace/SubscribeModal';
import {
  TrendingUp,
  Zap,
  Shield,
  Crown,
  Link2,
  AlertCircle,
  CheckCircle2,
  Settings2,
  RefreshCcw,
} from 'lucide-react';
import {
  DashboardPage,
  DashboardBreadcrumbs,
  DashboardPageHeader,
  DashButton,
  DashSectionTitle,
} from '@/components/dashboard/DashboardPrimitives';
import { cn } from '@/lib/utils';
import { formatBotName, findBotStrategy } from '@/lib/bot-labels';

const PLANS = [
  {
    name: 'Basic',
    price: 299,
    icon: TrendingUp,
    color: 'from-primary/20 to-primary/5',
    border: 'border-primary/30',
    badge: 'text-chart-5',
    maxLot: '0.5x',
    features: ['SL/TP risk controls', 'Up to 0.5x lot multiplier', 'Standard execution priority'],
  },
  {
    name: 'Pro',
    price: 799,
    icon: Zap,
    color: 'from-chart-2/20 to-chart-2/5',
    border: 'border-chart-2/30',
    badge: 'text-chart-2',
    maxLot: '2x',
    features: ['Full risk controls', 'Up to 2x lot multiplier', 'Priority execution', 'Drawdown limiter'],
    popular: true,
  },
  {
    name: 'VIP',
    price: 1399,
    icon: Crown,
    color: 'from-chart-4/20 to-chart-2/5',
    border: 'border-chart-4/30',
    badge: 'text-chart-4',
    maxLot: '5x',
    features: ['Full risk controls', 'Up to 5x lot multiplier', 'VIP-first execution', 'Custom drawdown limit', 'Direct support'],
  },
];

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  INACTIVE: 'bg-muted/60 text-muted-foreground border-[var(--card-border)]',
  PAUSED: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
  CANCELLED: 'bg-destructive/10 text-destructive border-destructive/20',
  EXPIRED: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function CopyTradingPage() {
  const qc = useQueryClient();
  const [connectOpen, setConnectOpen] = React.useState(false);
  const [settingsTarget, setSettingsTarget] = React.useState<any>(null);
  const [subscribePlan, setSubscribePlan] = React.useState<any>(null);
  const [billingModel, setBillingModel] = React.useState<SubscriptionBillingModel>('FIXED');

  const { data: brokers = [] } = useQuery({
    queryKey: ['broker-accounts'],
    queryFn: () => brokerApi.getBrokerAccounts(),
    staleTime: 8_000,
    refetchOnMount: false,
  });

  const { data: subscriptions = [], isLoading: subLoading } = useQuery({
    queryKey: ['copy-subscriptions'],
    queryFn: () => copyTradingApi.getMySubscriptions(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const { data: masters = [] } = useQuery({
    queryKey: ['copy-masters'],
    queryFn: () => copyTradingApi.listMasters(20),
    staleTime: 120_000,
    refetchOnWindowFocus: false,
  });

  const { data: relationships = [] } = useQuery({
    queryKey: ['copy-relationships'],
    queryFn: () => copyTradingApi.getMyRelationships(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const { data: mpData } = useQuery({
    queryKey: ['marketplace-bots'],
    queryFn: () => marketplaceApi.getMarketplace({ limit: 50 }),
  });

  const marketplaceItems = React.useMemo(() => {
    const raw = mpData?.items ?? mpData?.strategies ?? mpData?.data ?? [];
    return raw.map((item: any) => ({
      ...item,
      name: item.strategy?.name ?? item.name,
      strategy: item.strategy ?? item,
    }));
  }, [mpData]);

  const hasConnectedBroker = brokers.length > 0;

  const planWithStrategy = PLANS.map((p) => ({
    ...p,
    strategy: findBotStrategy(marketplaceItems, p.name),
  }));

  return (
    <DashboardPage className="mx-auto max-w-6xl px-1 sm:px-2">
      <DashboardBreadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'My Bots' }]} />

      <DashboardPageHeader
        title="Automated Trading Bots"
        description="Buy a bot plan, connect your MT5 broker, and live execution runs automatically."
        icon={Zap}
      />

      { }
      {!hasConnectedBroker && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 p-4 rounded-xl border border-chart-4/30 bg-chart-4/5"
        >
          <AlertCircle className="w-5 h-5 text-chart-4 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Connect your MT5 broker first</p>
            <p className="text-xs text-muted-foreground mt-0.5">Connect MT4/MT5 before your purchased bot can execute live trades.</p>
          </div>
          <DashButton variant="primary" onClick={() => setConnectOpen(true)} className="gap-2 shrink-0">
            <Link2 className="w-4 h-4" /> Connect Broker
          </DashButton>
        </motion.div>
      )}

      {hasConnectedBroker && (
        <BrokerAccountsPanel
          accounts={brokers}
          onConnect={() => setConnectOpen(true)}
        />
      )}

      {masters.length > 0 && (
        <section className="w-full min-w-0 pl-1 sm:pl-2">
          <DashSectionTitle className="mb-4">Public master traders</DashSectionTitle>
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
            {masters.slice(0, 6).map((master, idx) => (
              <motion.div
                key={master.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.3, ease: 'easeOut' }}
                whileHover={{ y: -3 }}
                className="flex w-full min-w-0 items-center justify-between rounded-xl border border-[var(--card-border)] p-4 transition-all duration-200 hover:border-[color-mix(in_srgb,var(--primary)_20%,var(--card-border))] hover:shadow-[var(--shadow-card-hover)]"
              >
                <div className="min-w-0 pr-3">
                  <p className="font-medium text-foreground">{master.displayName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    ROI {master.roiPct?.toFixed?.(1) ?? master.roiPct}% · Win {master.winRate?.toFixed?.(0) ?? master.winRate}%
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{master.followersCount} followers</span>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {relationships.length > 0 && (
        <div>
          <DashSectionTitle className="mb-4">Your copy relationships</DashSectionTitle>
          <div className="space-y-2">
            {relationships.map((rel: any, idx: number) => (
              <motion.div
                key={rel.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.3, ease: 'easeOut' }}
                className="rounded-xl border border-[var(--card-border)] px-4 py-3 flex items-center justify-between text-sm transition-colors duration-200 hover:border-[color-mix(in_srgb,var(--primary)_18%,var(--card-border))]"
              >
                <span className="font-medium">{rel.masterProfile?.displayName ?? 'Master'}</span>
                <span className={cn('px-2 py-0.5 rounded-md text-xs border', STATUS_STYLES[rel.status] ?? STATUS_STYLES.INACTIVE)}>
                  {rel.status}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Plan cards */}
      <section className="w-full min-w-0 pl-1 sm:pl-2">

        <DashSectionTitle className="mb-4">Buy a Bot Plan</DashSectionTitle>
        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
          {planWithStrategy.map((plan) => {
            const Icon = plan.icon;
            const isSubscribed = subscriptions.some(
              (s: any) =>
                (s.strategy?.name === `${plan.name} Bot` ||
                  s.strategy?.name === `${plan.name} Copy` ||
                  s.strategy?.name === 'Profytron Master Bot' ||
                  s.strategy?.name === 'Profytron Master Copy') &&
                s.status === 'ACTIVE',
            );
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                whileHover={{ y: -4 }}
                className={cn(
                  'relative flex w-full min-w-0 flex-col items-stretch rounded-2xl border bg-gradient-to-br p-5 glass transition-shadow duration-300 hover:shadow-[var(--shadow-card-hover)]',
                  plan.color,
                  plan.border,
                  plan.popular && 'ring-1 ring-chart-2/40',
                )}
              >
                {plan.popular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-chart-2 px-3 py-0.5 text-xs font-bold text-foreground">
                    Most Popular
                  </span>
                )}
                <div className="mb-4 flex items-center gap-3">
                  <div className={cn('rounded-xl bg-foreground/5 p-2', plan.badge)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-foreground">{plan.name}</p>
                    <p className={cn('text-sm', plan.badge)}>Max {plan.maxLot} lot</p>
                  </div>
                  <div className="ml-auto shrink-0 text-right">
                    <p className="text-xl font-bold text-foreground">₹{plan.price}</p>
                    <p className="text-sm text-muted-foreground">/month</p>
                  </div>
                </div>
                <ul className="mb-5 flex flex-1 flex-col gap-1.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-chart-3" />
                      {f}
                    </li>
                  ))}
                </ul>
                {isSubscribed ? (
                  <div className="py-2 text-center text-xs font-medium text-chart-3">
                    ✓ Bot enabled
                  </div>
                ) : (
                  <div className="mt-auto flex w-full flex-col items-stretch gap-2">
                    <DashButton
                      variant="primary"
                      className="w-full justify-center text-center"
                      disabled={!hasConnectedBroker || !plan.strategy}
                      onClick={() => {
                        if (!plan.strategy) return;
                        setBillingModel('FIXED');
                        setSubscribePlan(plan.strategy);
                      }}
                    >
                      Buy Subscription
                    </DashButton>
                    <DashButton
                      variant="outline"
                      className="w-full justify-center text-center"
                      disabled={!hasConnectedBroker || !plan.strategy}
                      onClick={() => {
                        if (!plan.strategy) return;
                        setBillingModel('PROFIT_SHARE');
                        setSubscribePlan(plan.strategy);
                      }}
                    >
                      Get Profit Sharing · ₹149
                    </DashButton>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </section>

      { }
      <div>
        <DashSectionTitle className="mb-4">My Active Bots</DashSectionTitle>
        {subLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : subscriptions.length === 0 ? (
          <div className="text-sm text-muted-foreground p-6 dashboard-card text-center">
            No bots enabled yet. Buy a plan above to get started.
          </div>
        ) : (
          <div className="rounded-xl border border-border-default overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground text-xs border-b border-border-default">
                  <th className="text-left px-4 py-3 font-medium">Bot</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Lot Multiplier</th>
                  <th className="text-left px-4 py-3 font-medium">Last Trade</th>
                  <th className="text-left px-4 py-3 font-medium">Expires</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub: any) => (
                  <tr key={sub.id} className="border-b border-border-default last:border-0 hover:bg-foreground/2">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {formatBotName(sub.strategy?.name ?? '—')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs border', STATUS_STYLES[sub.status] ?? STATUS_STYLES.INACTIVE)}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{(sub.lotMultiplier ?? 1).toFixed(2)}x</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {sub.lastExecutionAt ? new Date(sub.lastExecutionAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <DashButton variant="ghost" onClick={() => setSettingsTarget(sub)}>
                        <Settings2 className="w-4 h-4" />
                      </DashButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      { }
      {connectOpen && (
        <BrokerConnectModal
          open={connectOpen}
          onClose={() => {
            setConnectOpen(false);
            qc.invalidateQueries({ queryKey: ['broker-accounts'] });
            qc.invalidateQueries({ queryKey: ['broker-info'] });
          }}
        />
      )}

      {settingsTarget && (
        <CopySettingsSheet
          subscription={settingsTarget}
          onClose={() => {
            setSettingsTarget(null);
            qc.invalidateQueries({ queryKey: ['copy-subscriptions'] });
          }}
        />
      )}

      {subscribePlan && (
        <SubscribeModal
          strategy={subscribePlan}
          isOpen={!!subscribePlan}
          initialBillingModel={billingModel}
          onClose={() => {
            setSubscribePlan(null);
            qc.invalidateQueries({ queryKey: ['copy-subscriptions'] });
          }}
        />
      )}
    </DashboardPage>
  );
}
