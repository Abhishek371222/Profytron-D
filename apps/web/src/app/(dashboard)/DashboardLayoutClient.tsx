'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { AppShell } from '@/components/layout/AppShell';
import { AppProviders } from '@/components/providers/AppProviders';
import { ActivationChecklist } from '@/components/dashboard/ActivationChecklist';
import { cn, isAdminUser } from '@/lib/utils';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { X, ArrowRight, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useFcmToken } from '@/hooks/useFcmToken';

const DashboardBrokerConnectModal = dynamic(
  () => import('@/components/dashboard/DashboardBrokerConnectModal'),
  { ssr: false },
);

export default function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isAdmin = isAdminUser(user);

  // Register FCM push token for this browser session
  useFcmToken();
  const [showDemoBanner, setShowDemoBanner] = React.useState(false);
  const [showBrokerModal, setShowBrokerModal] = React.useState(false);
  const [initialBrokerId, setInitialBrokerId] = React.useState<string | undefined>();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted || isAdmin) return;
    const dismissed = window.localStorage.getItem('profytron_mt5_banner_dismissed');
    setShowDemoBanner(dismissed !== 'true');
  }, [mounted, isAdmin]);

  const handleDismissBanner = () => {
    setShowDemoBanner(false);
    if (mounted) window.localStorage.setItem('profytron_mt5_banner_dismissed', 'true');
  };

  const openBrokerModal = (brokerId?: string) => {
    setInitialBrokerId(brokerId);
    setShowBrokerModal(true);
  };

  const handleBrokerConnected = () => {
    setShowDemoBanner(false);
    if (mounted) window.localStorage.setItem('profytron_mt5_banner_dismissed', 'true');
  };

  const isBuilder = pathname?.includes('/strategies/builder');

  return (
    <AppProviders>
      <AppShell>
        <div suppressHydrationWarning className={cn('relative flex flex-col', !isBuilder && 'gap-6')}>
          <AnimatePresence>
            {mounted && showDemoBanner && !isBuilder && !isAdmin && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-background">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-chart-2/5 to-transparent pointer-events-none" />
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-primary via-chart-2 to-primary rounded-l-2xl" />
                  <button
                    onClick={handleDismissBanner}
                    aria-label="Dismiss"
                    className="absolute right-3 top-3 z-10 w-8 h-8 rounded-lg bg-muted border border-border hover:bg-muted/80 flex items-center justify-center transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <div className="relative flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5">
                    <div className="flex items-center gap-3 min-w-0 pr-10 sm:pr-0">
                      <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
                        <Zap className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-overline text-foreground">Connect MT5 Account</span>
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-micro font-semibold text-primary uppercase tracking-widest">Live Trading</span>
                        </div>
                        <p className="text-caption text-muted-foreground font-medium mt-0.5">Link your MetaTrader&nbsp;5 broker account to enable live bot execution</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0 sm:pr-10">
                      <button
                        onClick={() => openBrokerModal('IC_MARKETS')}
                        className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 h-9 rounded-xl bg-primary hover:brightness-110 text-primary-foreground text-overline transition-colors"
                      >
                        <Zap className="w-3.5 h-3.5 shrink-0" />
                        Connect Now
                      </button>
                      <button
                        onClick={() => openBrokerModal('PAPER')}
                        className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 h-9 rounded-xl bg-muted hover:bg-muted/80 border border-border text-muted-foreground hover:text-foreground text-overline transition-colors"
                      >
                        Demo
                        <ArrowRight className="w-3 h-3 shrink-0" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {mounted && !isBuilder && !isAdmin && (
            <ActivationChecklist />
          )}

          {showBrokerModal && (
            <DashboardBrokerConnectModal
              open={showBrokerModal}
              onClose={() => setShowBrokerModal(false)}
              initialBrokerId={initialBrokerId}
              onConnected={handleBrokerConnected}
            />
          )}

          <Suspense
            fallback={
              <div className="flex-1 flex flex-col gap-4 animate-pulse" aria-busy="true">
                <div className="h-8 w-64 rounded-xl bg-muted border border-border" />
                <div className="h-48 rounded-card bg-muted border border-border" />
                <div className="grid grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-28 rounded-card bg-muted border border-border" />
                  ))}
                </div>
              </div>
            }
          >
            {children}
          </Suspense>
        </div>
      </AppShell>
    </AppProviders>
  );
}
