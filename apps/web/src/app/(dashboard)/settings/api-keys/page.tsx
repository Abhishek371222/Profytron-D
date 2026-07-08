'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** API Keys section removed from dashboard — redirect legacy links. */
export default function APIKeysPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/settings/profile');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[12rem]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Redirecting…
        </span>
      </div>
    </div>
  );
}
