'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/stores/useAuthStore';

/** Logout after this much continuous inactivity. Matches the 24h session policy. */
export const INACTIVITY_LOGOUT_MS = 24 * 60 * 60 * 1000; // 24 hours

const LAST_ACTIVITY_KEY = 'profytron_last_activity_at';
const ACTIVITY_THROTTLE_MS = 1000;

const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  'mousemove',
  'mousedown',
  'keydown',
  'touchstart',
  'scroll',
  'click',
  'wheel',
  'pointerdown',
];

function readLastActivity(): number {
  if (typeof window === 'undefined') return Date.now();
  const raw = window.localStorage.getItem(LAST_ACTIVITY_KEY);
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : Date.now();
}

function writeLastActivity(at: number) {
  window.localStorage.setItem(LAST_ACTIVITY_KEY, String(at));
}

/**
 * Logs the user out after 24 hours with no mouse/keyboard/touch/scroll activity.
 * Activity in any tab resets the timer (via localStorage).
 * Does not log out based on JWT access-token age while the user is active.
 */
export function useInactivityLogout(enabled: boolean) {
  const logout = useAuthStore((s) => s.logout);
  const loggingOutRef = useRef(false);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    let timerId: ReturnType<typeof setTimeout> | null = null;
    let lastBumpAt = 0;

    const clearTimer = () => {
      if (timerId != null) {
        clearTimeout(timerId);
        timerId = null;
      }
    };

    const performLogout = async () => {
      if (loggingOutRef.current) return;
      loggingOutRef.current = true;
      clearTimer();
      try {
        toast.message('Logged out due to inactivity');
        await logout();
      } catch {
        useAuthStore.getState().clearAuth();
      } finally {
        window.localStorage.removeItem(LAST_ACTIVITY_KEY);
        const path = window.location.pathname;
        if (!path.startsWith('/login')) {
          window.location.href = '/login?idle=true';
        }
      }
    };

    const scheduleCheck = () => {
      clearTimer();
      const last = readLastActivity();
      const remaining = INACTIVITY_LOGOUT_MS - (Date.now() - last);
      if (remaining <= 0) {
        void performLogout();
        return;
      }
      timerId = setTimeout(() => {
        const idleFor = Date.now() - readLastActivity();
        if (idleFor >= INACTIVITY_LOGOUT_MS) {
          void performLogout();
        } else {
          scheduleCheck();
        }
      }, remaining);
    };

    const bumpActivity = () => {
      if (loggingOutRef.current) return;
      const now = Date.now();
      if (now - lastBumpAt < ACTIVITY_THROTTLE_MS) return;
      lastBumpAt = now;
      writeLastActivity(now);
      scheduleCheck();
    };

    // Seed activity on mount so a fresh login does not inherit a stale idle stamp.
    writeLastActivity(Date.now());
    scheduleCheck();

    for (const eventName of ACTIVITY_EVENTS) {
      window.addEventListener(eventName, bumpActivity, { passive: true });
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        // Returning to the tab is not enough by itself — only real input resets.
        // Re-check in case the idle window already elapsed while hidden.
        scheduleCheck();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    const onStorage = (event: StorageEvent) => {
      if (event.key !== LAST_ACTIVITY_KEY) return;
      scheduleCheck();
    };
    window.addEventListener('storage', onStorage);

    return () => {
      clearTimer();
      for (const eventName of ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, bumpActivity);
      }
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('storage', onStorage);
    };
  }, [enabled, logout]);
}
