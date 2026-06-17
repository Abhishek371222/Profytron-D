'use client';

import { useEffect, useState } from 'react';

/** True only after the component has mounted — use to defer client-only UI and avoid hydration mismatches. */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
