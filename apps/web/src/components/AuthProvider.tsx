'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { apiClient, unwrapApiResponse } from '@/lib/api/client';
import { resolvePostLoginRedirect } from '@/lib/utils';
import { useWorkspaceBootstrapStore } from '@/lib/stores/useWorkspaceBootstrapStore';

const SESSION_TOKEN_KEY = 'profytron_access';

/** Public marketing routes where anonymous visitors skip session network I/O. */
function isAnonymousMarketingPath(pathname: string): boolean {
  return pathname === '/' || pathname === '';
}

/**
 * True when the browser likely has a session we must hydrate.
 * Logged-in users keep full hydrate behavior; only clear anonymous landings skip.
 */
function hasSessionEvidence(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    if (sessionStorage.getItem(SESSION_TOKEN_KEY)) return true;
  } catch {
    /* private mode */
  }
  const cookies = document.cookie || '';
  return (
    cookies.includes('pf_session_hint=1') ||
    cookies.includes('demo_access=1')
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { hydrate, login, isHydrating, isAuthenticated } = useAuthStore();
  const bootstrapActive = useWorkspaceBootstrapStore((s) => s.active);

  useEffect(() => {
    if (window.location.pathname.startsWith('/auth/callback')) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const oauthCode = params.get('oauthCode');

    if (oauthCode) {
      (async () => {
        try {
          const exchRes = await apiClient.get(
            `/auth/oauth-token-exchange?code=${encodeURIComponent(oauthCode)}`,
          );
          const { accessToken } = unwrapApiResponse<{ accessToken: string }>(exchRes.data);

          const meRes = await apiClient.get('/users/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const user = unwrapApiResponse<any>(meRes.data);

          login(accessToken, user);

          const url = new URL(window.location.href);
          const redirectTo = url.searchParams.get('redirect');
          url.searchParams.delete('oauthCode');
          url.searchParams.delete('redirect');
          window.history.replaceState({}, '', url.toString());
          const dest = resolvePostLoginRedirect(user, redirectTo);
          useWorkspaceBootstrapStore.getState().startBootstrap(dest);
          router.replace(dest);
        } catch {
          hydrate();
        }
      })();
    } else if (
      isAnonymousMarketingPath(window.location.pathname) &&
      !hasSessionEvidence()
    ) {
      // Anonymous landing visitors: skip refreshSession + /users/me.
      // Logged-in users (session hint / access token) still hydrate normally.
      useAuthStore.setState({
        isHydrating: false,
        isAuthenticated: false,
        sessionReady: false,
      });
    } else {
      void hydrate().catch(() => undefined);
    }
  }, [hydrate, login, router]);

  useEffect(() => {
    if (!bootstrapActive) return;
    if (isHydrating) return;
    if (isAuthenticated) return;
    useWorkspaceBootstrapStore.getState().finish();
  }, [bootstrapActive, isHydrating, isAuthenticated]);

  return <>{children}</>;
}
