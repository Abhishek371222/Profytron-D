'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/useAuthStore';
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
  const { hydrate, isHydrating } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [hydrationCap, setHydrationCap] = useState(false);
  const skipBlockingLoader = isPublicRoute(pathname);

  useEffect(() => {
    setMounted(true);
    hydrate();
  }, [hydrate]);

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
