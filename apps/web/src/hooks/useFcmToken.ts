'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { apiClient } from '@/lib/api/client';

const FIREBASE_CONFIG = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

const FCM_APP_NAME = 'profytron-fcm';

export function useFcmToken() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || typeof window === 'undefined') return;
    if (!FIREBASE_CONFIG.projectId || !VAPID_KEY) return;

    let unsubscribe: (() => void) | null = null;

    (async () => {
      try {
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

        await apiClient.post('/notifications/fcm-token', { token, platform: 'web' });

        unsubscribe = onMessage(messaging, (payload) => {
          const title = payload.notification?.title ?? 'Profytron';
          const body  = payload.notification?.body  ?? '';
          if (Notification.permission === 'granted') {
            new Notification(title, { body, icon: '/brand-mark.png' });
          }
        });
      } catch {
      }
    })();

    return () => {
      unsubscribe?.();
      if (tokenRef.current) {
        apiClient.post('/notifications/fcm-token/remove', { token: tokenRef.current }).catch(() => {});
      }
    };
  }, [isAuthenticated]);
}
