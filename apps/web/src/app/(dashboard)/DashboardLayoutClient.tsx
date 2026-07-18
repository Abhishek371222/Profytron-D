'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { AppShell } from '@/components/layout/AppShell';
import { AppProviders } from '@/components/providers/AppProviders';
import { ActivationChecklist } from '@/components/dashboard/ActivationChecklist';
import { BrokerConnectBanner } from '@/components/dashboard/BrokerConnectBanner';
import { OfflineBanner } from '@/components/product/OfflineBanner';
import { TutorialOverlay } from '@/components/tutorial/TutorialOverlay';
import { TutorialPrompt } from '@/components/tutorial/TutorialPrompt';
import { cn, isAdminUser } from '@/lib/utils';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useTutorialStore } from '@/lib/stores/useTutorialStore';
import { AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { brokerApi } from '@/lib/api/broker';
import { useFcmToken } from '@/hooks/useFcmToken';
import { useInactivityLogout } from '@/hooks/useInactivityLogout';
import { useWorkspaceBootstrapStore } from '@/lib/stores/useWorkspaceBootstrapStore';
import { useAccountContext } from '@/hooks/useAccountContext';
import { useQueryClient } from '@tanstack/react-query';
import { RenderBoundary } from '@/platform/rendering';
import { metricsApi } from '@/platform/metrics';
import { animationApi } from '@/platform/animation';
import {
  startMotionEngine,
  isMotionEngineEnabled,
  MotionProfilerOverlay,
} from '@/platform/motion';
import {
  startExperienceEngine,
  isExperienceEngineEnabled,
  ExperienceDevPanel,
} from '@/platform/experience';

const BrokerConnectModal = dynamic(
  () =>
    import('@/components/copy-trading/BrokerConnectModal').then((m) => ({
      default: m.BrokerConnectModal,
    })),
  { ssr: false },
);

function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isAdmin = isAdminUser(user);
  const bootstrapActive = useWorkspaceBootstrapStore((s) => s.active);
  const { hasBrokerAccount } = useAccountContext();
  const queryClient = useQueryClient();
  const notifyTourAction = useTutorialStore((s) => s.notifyAction);

  useFcmToken();
  useInactivityLogout(Boolean(user) && !bootstrapActive);
  const [showDemoBanner, setShowDemoBanner] = React.useState(false);
  const [showBrokerModal, setShowBrokerModal] = React.useState(false);
  const [connectingDemo, setConnectingDemo] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (process.env.NEXT_PUBLIC_PLATFORM_METRICS !== '1') return;
    const stopLong = metricsApi.observeLongTasks();
    const stopFps = metricsApi.startFpsSampler(8);
    return () => {
      stopLong();
      stopFps();
    };
  }, []);

  React.useEffect(() => {
    if (!isMotionEngineEnabled()) return;
    return startMotionEngine();
  }, []);

  React.useEffect(() => {
    if (!isExperienceEngineEnabled()) return;
    return startExperienceEngine();
  }, []);

  React.useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'hidden') animationApi.pauseAll();
      else animationApi.resumeAll();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  React.useEffect(() => {
    if (!mounted || isAdmin || bootstrapActive) return;
    if (hasBrokerAccount) {
      setShowDemoBanner(false);
      return;
    }
    const dismissed = window.localStorage.getItem('profytron_mt5_banner_dismissed');
    setShowDemoBanner(dismissed !== 'true');
  }, [mounted, isAdmin, bootstrapActive, hasBrokerAccount]);

  const handleDismissBanner = () => {
    setShowDemoBanner(false);
    if (mounted) window.localStorage.setItem('profytron_mt5_banner_dismissed', 'true');
  };

  const openBrokerModal = () => {
    setShowBrokerModal(true);
  };

  const handleBrokerConnected = () => {
    setShowDemoBanner(false);
    if (mounted) window.localStorage.setItem('profytron_mt5_banner_dismissed', 'true');
    void queryClient.invalidateQueries({ queryKey: ['broker-accounts'] });
    notifyTourAction('broker-connected');
  };

  const connectDemoAccount = async () => {
    if (connectingDemo) return;
    setConnectingDemo(true);
    try {
      await brokerApi.connectBroker({
        brokerName: 'PAPER',
        login: 'PAPER',
        password: '',
        serverName: 'PAPER',
        platform: 'mt5',
      });
      toast.success('Demo account connected', {
        description: 'A paper-trading account is ready for testing.',
      });
      handleBrokerConnected();
    } catch (e: any) {
      toast.error('Could not start demo account', {
        description:
          e?.response?.data?.message || e?.message || 'Please try again.',
      });
    } finally {
      setConnectingDemo(false);
    }
  };

  const isBuilder = pathname?.includes('/strategies/builder');
  const isCoach = pathname?.includes('/alpha-coach');
  const fillViewport = isBuilder || isCoach;

  if (bootstrapActive) {
    return <div className="min-h-[100dvh] w-full bg-background" aria-hidden />;
  }

  return (
    <AppShell>
      <div
        suppressHydrationWarning
        className={cn(
          'relative flex min-h-0 flex-col',
          fillViewport ? 'h-full flex-1 overflow-hidden' : 'gap-[var(--section-gap)]',
        )}
      >
        <AnimatePresence>
          {mounted && showDemoBanner && !fillViewport && !isAdmin && (
            <BrokerConnectBanner
              onConnect={openBrokerModal}
              onDemo={connectDemoAccount}
              onDismiss={handleDismissBanner}
              connectingDemo={connectingDemo}
            />
          )}
        </AnimatePresence>

        {/* PRODUCT_DEBT / ERROR_GUIDE — one offline banner for the dashboard shell */}
        {mounted && <OfflineBanner />}

        {mounted && !fillViewport && !isAdmin && (
          <ActivationChecklist compact={showDemoBanner} />
        )}
        {mounted && !fillViewport && !isAdmin && <TutorialPrompt />}
        {mounted && !fillViewport && !isAdmin && <TutorialOverlay />}

        {showBrokerModal && (
          <BrokerConnectModal
            open={showBrokerModal}
            onClose={() => setShowBrokerModal(false)}
            onConnected={handleBrokerConnected}
          />
        )}

        <Suspense
          fallback={
            <div className="flex min-h-0 flex-1 flex-col gap-4 animate-pulse" aria-busy="true">
              <div className="h-8 w-64 rounded-xl bg-muted border border-border" />
              <div className="h-48 rounded-card bg-muted border border-border" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-28 rounded-card bg-muted border border-border" />
                ))}
              </div>
            </div>
          }
        >
          <RenderBoundary>
            {fillViewport ? (
              <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                {children}
              </div>
            ) : (
              children
            )}
          </RenderBoundary>
        </Suspense>
        {isMotionEngineEnabled() && <MotionProfilerOverlay />}
        {isExperienceEngineEnabled() && <ExperienceDevPanel />}
      </div>
    </AppShell>
  );
}

export default function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>
      <DashboardShell>{children}</DashboardShell>
    </AppProviders>
  );
}
