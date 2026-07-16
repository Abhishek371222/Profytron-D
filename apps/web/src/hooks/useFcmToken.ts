'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { apiClient } from '@/lib/api/client';

// Deliberately separate from lib/firebase/client.ts (Auth): FCM stays on the
// original Firebase project so already-registered push tokens keep working,
// while Auth moved to a different project. Do not consolidate these.
const FIREBASE_CONFIG = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

// Named app so this never collides with lib/firebase/client.ts's 'profytron-login'
// app. getApps() returns every initialized app regardless of project, so picking
// getApps()[0] blindly would silently reuse the login app (no messagingSenderId)
// whenever Auth already initialized first — breaking push with no visible error.
const FCM_APP_NAME = 'profytron-fcm';

/** Registers an FCM push token on mount and removes it on unmount. */
export function useFcmToken() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || typeof window === 'undefined') return;
    if (!FIREBASE_CONFIG.projectId || !VAPID_KEY) return;

    let unsubscribe: (() => void) | null = null;

    (async () => {
      try {
        // Dynamically import firebase/messaging to keep bundle lean
        const { initializeApp, getApps, getApp } = await import('firebase/app');
        const { getMessaging, getToken, onMessage } = await import('firebase/messaging');

        const app = getApps().some((a) => a.name === FCM_APP_NAME)
          ? getApp(FCM_APP_NAME)
          : initializeApp(FIREBASE_CONFIG, FCM_APP_NAME);

        const messaging = getMessaging(app);

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const token = await getToken(messaging, { vapidKey: VAPID_KEY });
        if (!token) return;

        tokenRef.current = token;

        // Register with backend
        await apiClient.post('/notifications/fcm-token', { token, platform: 'web' });

        // Handle foreground messages — show a toast-style notification
        unsubscribe = onMessage(messaging, (payload) => {
          const title = payload.notification?.title ?? 'Profytron';
          const body  = payload.notification?.body  ?? '';
          if (Notification.permission === 'granted') {
            new Notification(title, { body, icon: '/brand-mark.png' });
          }
        });
      } catch {
        // Silent — push is enhancement, never critical
      }
    })();

    return () => {
      unsubscribe?.();
      // Remove token on logout/unmount
      if (tokenRef.current) {
        apiClient.post('/notifications/fcm-token/remove', { token: tokenRef.current }).catch(() => {});
      }
    };
  }, [isAuthenticated]);
}
