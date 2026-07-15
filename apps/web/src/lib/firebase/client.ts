'use client';

// Deliberately separate from hooks/useFcmToken.ts (FCM): this is a different
// Firebase project than push notifications use. FCM stays on the original
// project so already-registered push tokens keep working; login moved here.
const FIREBASE_LOGIN_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_LOGIN_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_LOGIN_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_LOGIN_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_LOGIN_APP_ID,
};

const LOGIN_APP_NAME = 'profytron-login';

export async function getFirebaseAuth() {
  if (!FIREBASE_LOGIN_CONFIG.apiKey || !FIREBASE_LOGIN_CONFIG.projectId) {
    return null;
  }
  const { initializeApp, getApps, getApp } = await import('firebase/app');
  const app = getApps().some((a) => a.name === LOGIN_APP_NAME)
    ? getApp(LOGIN_APP_NAME)
    : initializeApp(FIREBASE_LOGIN_CONFIG, LOGIN_APP_NAME);
  const { getAuth } = await import('firebase/auth');
  return getAuth(app);
}
