'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { apiClient, unwrapApiResponse } from '@/lib/api/client';
import { resolvePostLoginRedirect } from '@/lib/utils';
import { useWorkspaceBootstrapStore } from '@/lib/stores/useWorkspaceBootstrapStore';

const PUBLIC_PREFIXES = [
  '/login',
  '/register',
  '/signup',
  '/auth',
  '/onboarding',
  '/docs',
  '/documentation',
  '/api-reference',
  '/pricing',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
];

function isPublicRoute(pathname: string): boolean {
  if (pathname === '/') return true;
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { hydrate, login, isHydrating, isAuthenticated } = useAuthStore();
  const bootstrapActive = useWorkspaceBootstrapStore((s) => s.active);
  const startBootstrap = useWorkspaceBootstrapStore((s) => s.startBootstrap);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

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
      hydrate();
    }
  }, [hydrate, login, router]);

  // Cold restore into a private route — same premium workspace prep, not a blank screen.
  useEffect(() => {
    if (!mounted) return;
    if (isPublicRoute(pathname)) return;
    if (bootstrapActive) return;
    if (!isHydrating) return;
    startBootstrap(pathname);
  }, [mounted, pathname, isHydrating, bootstrapActive, startBootstrap]);

  // If hydrate finished unauthenticated, drop the overlay so login can appear.
  useEffect(() => {
    if (!bootstrapActive) return;
    if (isHydrating) return;
    if (isAuthenticated) return;
    useWorkspaceBootstrapStore.getState().finish();
  }, [bootstrapActive, isHydrating, isAuthenticated]);

  return <>{children}</>;
}
