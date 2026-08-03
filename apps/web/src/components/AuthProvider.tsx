'use client';

import React, { useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { apiClient, unwrapApiResponse } from '@/lib/api/client';
import { resolvePostLoginRedirect } from '@/lib/utils';
import { useWorkspaceBootstrapStore } from '@/lib/stores/useWorkspaceBootstrapStore';

const SESSION_TOKEN_KEY = 'profytron_access';

/** Login/register flows — never probe cookie refresh (browser red-logs every 401). */
function isAuthFormPath(pathname: string): boolean {
  return (
    pathname === '/login' ||
    pathname === '/register' ||
    pathname.startsWith('/login/') ||
    pathname.startsWith('/register/') ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password' ||
    pathname === '/verify-email'
  );
}

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

function hasSessionAccessToken(): boolean {
  try {
    const t = sessionStorage.getItem(SESSION_TOKEN_KEY);
    return Boolean(t && t.length > 20);
  } catch {
    return false;
  }
}

function settleAnonymous() {
  try {
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
  } catch {
    /* private mode */
  }
  useAuthStore.setState({
    user: null,
    accessToken: null,
    isHydrating: false,
    isAuthenticated: false,
    sessionReady: false,
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { hydrate, login, isHydrating, isAuthenticated } = useAuthStore();
  const bootstrapActive = useWorkspaceBootstrapStore((s) => s.active);

  useEffect(() => {
    if (window.location.pathname.startsWith('/auth/callback')) {
      return;
    }

    const pathname = window.location.pathname;
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
          const dest = resolvePostLoginRedirect(user, redirectTo);
          // Hard navigation: soft client nav can race httpOnly cookie visibility
          // in Safari/middleware and bounce back to /login.
          window.location.assign(dest);
        } catch {
          hydrate();
        }
      })();
    } else if (isAuthFormPath(pathname)) {
      // Register/login: never call /auth/refresh without an access token —
      // invalid/missing refresh cookies always surface as console 401 noise.
      if (hasSessionAccessToken()) {
        void hydrate().catch(() => undefined);
      } else {
        settleAnonymous();
      }
    } else if (isAnonymousMarketingPath(pathname) && !hasSessionEvidence()) {
      // Anonymous landing visitors: skip refreshSession + /users/me.
      settleAnonymous();
    } else {
      void hydrate().catch(() => undefined);
    }
  }, [hydrate, login]);

  useEffect(() => {
    if (!bootstrapActive) return;
    if (isHydrating) return;
    if (isAuthenticated) return;
    useWorkspaceBootstrapStore.getState().finish();
  }, [bootstrapActive, isHydrating, isAuthenticated]);

  return <>{children}</>;
}
