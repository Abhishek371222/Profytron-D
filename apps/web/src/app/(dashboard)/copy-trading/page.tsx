'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { copyTradingApi } from '@/lib/api/copy-trading';
import { brokerApi } from '@/lib/api/broker';
import { marketplaceApi } from '@/lib/api/marketplace';
import { BrokerConnectModal } from '@/components/copy-trading/BrokerConnectModal';
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
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const PLANS = [
  {
    name: 'Basic',
    price: 299,
    icon: TrendingUp,
    color: 'from-blue-500/20 to-blue-600/5',
    border: 'border-blue-500/30',
    badge: 'text-blue-400',
    maxLot: '0.5x',
    features: ['SL/TP risk controls', 'Up to 0.5x lot multiplier', 'Standard execution priority'],
  },
  {
    name: 'Pro',
    price: 799,
    icon: Zap,
    color: 'from-violet-500/20 to-violet-600/5',
    border: 'border-violet-500/30',
    badge: 'text-violet-400',
    maxLot: '2x',
    features: ['Full risk controls', 'Up to 2x lot multiplier', 'Priority execution', 'Drawdown limiter'],
    popular: true,
  },
  {
    name: 'VIP',
    price: 1399,
    icon: Crown,
    color: 'from-amber-500/20 to-amber-600/5',
    border: 'border-amber-500/30',
    badge: 'text-amber-400',
    maxLot: '5x',
    features: ['Full risk controls', 'Up to 5x lot multiplier', 'VIP-first execution', 'Custom drawdown limit', 'Direct support'],
  },
];

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  INACTIVE: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  PAUSED: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/20',
  EXPIRED: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function CopyTradingPage() {
  const qc = useQueryClient();
  const [connectOpen, setConnectOpen] = React.useState(false);
  const [settingsTarget, setSettingsTarget] = React.useState<any>(null);
  const [subscribePlan, setSubscribePlan] = React.useState<any>(null);

  const { data: brokers = [] } = useQuery({
    queryKey: ['broker-accounts'],
    queryFn: () => brokerApi.getBrokerAccounts(),
  });

  const { data: subscriptions = [], isLoading: subLoading } = useQuery({
    queryKey: ['copy-subscriptions'],
    queryFn: () => copyTradingApi.getMySubscriptions(),
    refetchInterval: 10000,
  });

  // Fetch marketplace strategies tagged as copy trading plans
  const { data: mpData } = useQuery({
    queryKey: ['marketplace-copy'],
    queryFn: () => marketplaceApi.getMarketplace({ limit: 50 }),
  });

  const strategies: Record<string, any> = React.useMemo(() => {
    const map: Record<string, any> = {};
    const items = mpData?.strategies ?? mpData?.data ?? [];
    for (const s of items) {
      ['Basic Copy', 'Pro Copy', 'VIP Copy'].forEach((name) => {
        if (s.name === name) map[name] = s;
      });
    }
    return map;
  }, [mpData]);

  const hasConnectedBroker = brokers.length > 0;

  const planWithStrategy = PLANS.map((p) => ({
    ...p,
    strategy: strategies[`${p.name} Copy`] ?? null,
  }));

  return (
    <div className="flex flex-col gap-8 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Copy Trading</h1>
        <p className="text-sm text-text-secondary mt-1">
          Automatically copy trades from the operator's master MT5 account. Subscribe to a plan, connect your broker, and trades are mirrored in real-time.
        </p>
      </div>

      {/* Broker connection banner */}
      {!hasConnectedBroker && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5"
        >
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-text-primary">Connect your MT5 broker first</p>
            <p className="text-xs text-text-secondary mt-0.5">You need a connected MT4/MT5 account before copy trades can be executed.</p>
          </div>
          <Button size="sm" onClick={() => setConnectOpen(true)}>
            <Link2 className="w-4 h-4 mr-2" /> Connect Broker
          </Button>
        </motion.div>
      )}

      {hasConnectedBroker && (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <p className="text-sm text-emerald-400">
            Broker connected — {brokers[0]?.brokerName} ···{brokers[0]?.accountNumberLast4}
          </p>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setConnectOpen(true)}>
            <Link2 className="w-3.5 h-3.5 mr-1" /> Change
          </Button>
        </div>
      )}

      {/* Plan cards */}
      <div>
        <h2 className="text-base font-semibold text-text-primary mb-4">Choose a Copy Trading Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {planWithStrategy.map((plan) => {
            const Icon = plan.icon;
            const isSubscribed = subscriptions.some(
              (s: any) => s.strategy?.name === `${plan.name} Copy` && s.status === 'ACTIVE',
            );
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'relative flex flex-col p-5 rounded-2xl border bg-gradient-to-br glass',
                  plan.color,
                  plan.border,
                  plan.popular && 'ring-1 ring-violet-500/40',
                )}
              >
                {plan.popular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest px-3 py-0.5 rounded-full bg-violet-500 text-white">
                    Most Popular
                  </span>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn('p-2 rounded-xl bg-white/5', plan.badge)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">{plan.name}</p>
                    <p className={cn('text-xs', plan.badge)}>Max {plan.maxLot} lot</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-lg font-bold text-text-primary">₹{plan.price}</p>
                    <p className="text-xs text-text-secondary">/month</p>
                  </div>
                </div>
                <ul className="flex flex-col gap-1.5 mb-5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-text-secondary">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {isSubscribed ? (
                  <div className="text-center text-xs font-medium text-emerald-400 py-2">
                    ✓ Active subscription
                  </div>
                ) : (
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={!hasConnectedBroker || !plan.strategy}
                    onClick={() => plan.strategy && setSubscribePlan(plan.strategy)}
                  >
                    Subscribe
                  </Button>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Active subscriptions */}
      <div>
        <h2 className="text-base font-semibold text-text-primary mb-4">My Copy Subscriptions</h2>
        {subLoading ? (
          <div className="text-sm text-text-secondary">Loading…</div>
        ) : subscriptions.length === 0 ? (
          <div className="text-sm text-text-secondary p-6 border border-border-default rounded-xl text-center">
            No active copy subscriptions yet. Subscribe to a plan above to get started.
          </div>
        ) : (
          <div className="rounded-xl border border-border-default overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-text-secondary text-xs border-b border-border-default">
                  <th className="text-left px-4 py-3 font-medium">Strategy</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Lot Multiplier</th>
                  <th className="text-left px-4 py-3 font-medium">Last Trade</th>
                  <th className="text-left px-4 py-3 font-medium">Expires</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub: any) => (
                  <tr key={sub.id} className="border-b border-border-default last:border-0 hover:bg-white/2">
                    <td className="px-4 py-3 font-medium text-text-primary">{sub.strategy?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs border', STATUS_STYLES[sub.status] ?? STATUS_STYLES.INACTIVE)}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{(sub.lotMultiplier ?? 1).toFixed(2)}x</td>
                    <td className="px-4 py-3 text-text-secondary">
                      {sub.lastExecutionAt ? new Date(sub.lastExecutionAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" onClick={() => setSettingsTarget(sub)}>
                        <Settings2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {connectOpen && (
        <BrokerConnectModal
          open={connectOpen}
          onClose={() => {
            setConnectOpen(false);
            qc.invalidateQueries({ queryKey: ['broker-accounts'] });
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
          onClose={() => {
            setSubscribePlan(null);
            qc.invalidateQueries({ queryKey: ['copy-subscriptions'] });
          }}
        />
      )}
    </div>
  );
}
