'use client';

import { useEffect, useRef } from 'react';
import { authApi } from '@/lib/api/auth';

/** How often an active tab re-claims the single-session slot while in use. */
const CLAIM_THROTTLE_MS = 30_000;

const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  'mousedown',
  'keydown',
  'touchstart',
  'click',
  'wheel',
  'pointerdown',
];

/**
 * Claims this tab as the single active session on mount and on throttled
 * user interaction. The backend rejects any other tab's access token once a
 * newer claim lands (see apps/api .../jwt.strategy.ts), so the previously
 * active tab is logged out on its next authenticated request.
 */
export function useSessionActivity(enabled: boolean) {
  const lastClaimAtRef = useRef(0);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const claim = () => {
      const now = Date.now();
      if (now - lastClaimAtRef.current < CLAIM_THROTTLE_MS) return;
      lastClaimAtRef.current = now;
      authApi.activateSession().catch(() => {
        // Non-fatal: a missed claim just means enforcement stays quiet until
        // the next successful one — never block the user's actual action on it.
      });
    };

    claim();

    for (const eventName of ACTIVITY_EVENTS) {
      window.addEventListener(eventName, claim, { passive: true });
    }

    return () => {
      for (const eventName of ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, claim);
      }
    };
  }, [enabled]);
}
