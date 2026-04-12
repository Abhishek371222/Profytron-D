'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/settings/profile');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-p/20 border-t-p rounded-full animate-spin" />
        <span className="text-xs font-semibold text-white/30 uppercase tracking-[0.5em]">Initializing_Subsystem...</span>
      </div>
    </div>
  );
}
