'use client';
import { useState, useEffect } from 'react';

const cache = new Map<string, { enabled: boolean; ts: number }>();
const TTL_MS = 60_000;

export function useFeatureFlag(key: string, userId?: string): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.ts < TTL_MS) {
      setEnabled(cached.enabled);
      return;
    }

    const params = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/flags/${key}${params}`, {
      credentials: 'include',
    })
      .then((r) => r.json())
      .then((data: { enabled?: boolean }) => {
        const value = data?.enabled ?? false;
        cache.set(key, { enabled: value, ts: Date.now() });
        setEnabled(value);
      })
      .catch(() => setEnabled(false));
  }, [key, userId]);

  return enabled;
}
