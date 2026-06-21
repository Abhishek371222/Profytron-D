'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { apiClient, unwrapApiResponse } from '@/lib/api/client';
import { resolvePostLoginRedirect } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

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
  '/oauth-diagnostics',
  '/oauth-test',
];

function isPublicRoute(pathname: string): boolean {
  if (pathname === '/') return true;
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

const HYDRATION_CAP_MS = 600;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { hydrate, login, isHydrating } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [hydrationCap, setHydrationCap] = useState(false);
  const skipBlockingLoader = isPublicRoute(pathname);

  useEffect(() => {
    setMounted(true);

    // The dedicated /auth/callback page owns OAuth code exchange + session
    // bootstrap. Running the exchange / hydrate() here too would consume the
    // single-use code first and break that page.
    if (window.location.pathname.startsWith('/auth/callback')) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const oauthCode = params.get('oauthCode');

    if (oauthCode) {
      // Exchange the one-time OAuth code for an access token, then load the user profile.
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

          // Strip oauthCode (and redirect) from URL, then navigate to destination.
          const url = new URL(window.location.href);
          const redirectTo = url.searchParams.get('redirect');
          url.searchParams.delete('oauthCode');
          url.searchParams.delete('redirect');
          window.history.replaceState({}, '', url.toString());
          router.replace(resolvePostLoginRedirect(user, redirectTo));
        } catch {
          // Code expired or invalid — fall back to normal session hydration.
          hydrate();
        }
      })();
    } else {
      hydrate();
    }
  }, [hydrate, login, router]);

  useEffect(() => {
    const t = window.setTimeout(() => setHydrationCap(true), HYDRATION_CAP_MS);
    return () => window.clearTimeout(t);
  }, [pathname]);

  const showBlockingLoader =
    !skipBlockingLoader && mounted && isHydrating && !hydrationCap;

  if (showBlockingLoader) {
    return (
      <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" aria-label="Loading" />
      </div>
    );
  }

  return (
    <>
      {children}
      {!skipBlockingLoader && isHydrating && hydrationCap && (
        <div
          className="fixed bottom-4 right-4 z-[100] flex items-center gap-2 rounded-xl border border-[var(--card-border)] bg-card px-3 py-2 text-xs text-muted-foreground shadow-lg"
          aria-live="polite"
        >
          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
          Syncing session…
        </div>
      )}
    </>
  );
}
