'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { Loader2, Zap } from 'lucide-react';

const PUBLIC_PREFIXES = [
  '/login',
  '/register',
  '/signup',
  '/auth',
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { hydrate, isHydrating } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const skipBlockingLoader = isPublicRoute(pathname);

  useEffect(() => {
    setMounted(true);
    hydrate();
  }, [hydrate]);

  if (!skipBlockingLoader && (!mounted || isHydrating)) {
    return (
      <div className="min-h-screen w-full bg-bg-base flex flex-col items-center justify-center relative overflow-hidden noise">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-200 bg-p/5 blur-[120px] rounded-full animate-pulse" />
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="w-24 h-24 rounded-3xl bg-bg-card/40 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-2xl relative">
            <Zap className="w-10 h-10 text-p fill-p animate-pulse" />
            <div className="absolute inset-[-10px] bg-p/20 blur-xl rounded-full -z-10 animate-pulse" />
          </div>
          <div className="flex items-center gap-3 text-p uppercase tracking-widest font-bold text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Synchronizing Matrix</span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
