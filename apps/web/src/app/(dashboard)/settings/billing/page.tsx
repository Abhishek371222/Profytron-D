'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Keep /settings/billing working — Billing Center lives at /billing */
export default function SettingsBillingRedirect() {
  const router = useRouter();

  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    router.replace(`/billing${hash || '#billing-plans'}`);
  }, [router]);

  return (
    <main className="flex min-h-[40vh] items-center justify-center p-8" aria-busy="true" aria-live="polite">
      <p className="text-sm text-muted-foreground">Opening Billing Center…</p>
    </main>
  );
}
