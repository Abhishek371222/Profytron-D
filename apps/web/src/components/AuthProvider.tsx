'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { apiClient, unwrapApiResponse } from '@/lib/api/client';
import { resolvePostLoginRedirect } from '@/lib/utils';
import { useWorkspaceBootstrapStore } from '@/lib/stores/useWorkspaceBootstrapStore';

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
    } else {
      void hydrate().catch(() => undefined);
    }
  }, [hydrate, login, router]);

  // Prep screen is login/OAuth only — never on F5 / cold restore.
  // Refreshing /dashboard must reopen the dashboard once hydrate finishes.

  // If hydrate finished unauthenticated, drop any leftover overlay so login can appear.
  useEffect(() => {
    if (!bootstrapActive) return;
    if (isHydrating) return;
    if (isAuthenticated) return;
    useWorkspaceBootstrapStore.getState().finish();
  }, [bootstrapActive, isHydrating, isAuthenticated]);

  return <>{children}</>;
}
