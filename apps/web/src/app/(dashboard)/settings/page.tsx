'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/settings/profile');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[25rem]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.2em]">
          Opening profile…
        </span>
      </div>
    </div>
  );
}
