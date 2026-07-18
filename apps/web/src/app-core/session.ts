/**
 * Application Core — sole owner of session / workspace / selected account /
 * permissions / feature flags / workspace lifecycle.
 * Transport remains Zustand auth store; this is the product facade.
 */
'use client';

import { useAuthStore } from '@/lib/stores/useAuthStore';
import { isAdminUser } from '@/lib/utils';

export type AppSession = {
  user: ReturnType<typeof useAuthStore.getState>['user'];
  accessToken: string | null;
  isAuthenticated: boolean;
  sessionReady: boolean;
  isHydrating: boolean;
};

export function useAppSession(): AppSession {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const sessionReady = useAuthStore((s) => s.sessionReady);
  const isHydrating = useAuthStore((s) => s.isHydrating);
  return { user, accessToken, isAuthenticated, sessionReady, isHydrating };
}

export function useAppUserId(): string | undefined {
  return useAuthStore((s) => s.user?.id);
}

export function useAppPermissions() {
  const user = useAuthStore((s) => s.user);
  return {
    isAdmin: isAdminUser(user),
    role: user?.role ?? null,
    tier: user?.subscriptionTier ?? null,
  };
}

/** Feature flags — env + user tier; extend when Nest flags are wired. */
export function useAppFeatureFlags() {
  const platformEngine =
    process.env.NEXT_PUBLIC_PLATFORM_ENGINE !== '0';
  return {
    platformEngine,
    metricsOverlay: process.env.NEXT_PUBLIC_PLATFORM_METRICS === '1',
  };
}

export function getAppSessionSnapshot(): AppSession {
  const s = useAuthStore.getState();
  return {
    user: s.user,
    accessToken: s.accessToken,
    isAuthenticated: s.isAuthenticated,
    sessionReady: s.sessionReady,
    isHydrating: s.isHydrating,
  };
}
