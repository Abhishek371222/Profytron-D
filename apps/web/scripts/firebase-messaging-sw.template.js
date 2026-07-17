importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Generated into public/firebase-messaging-sw.js by scripts/generate-firebase-sw.mjs
// (runs via the predev/prebuild hooks) — service workers are static files, so
// Next.js's NEXT_PUBLIC_* build-time inlining never touches anything under public/.
firebase.initializeApp({
  apiKey: '__NEXT_PUBLIC_FIREBASE_API_KEY__',
  authDomain: '__NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN__',
  projectId: '__NEXT_PUBLIC_FIREBASE_PROJECT_ID__',
  storageBucket: '__NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET__',
  messagingSenderId: '__NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID__',
  appId: '__NEXT_PUBLIC_FIREBASE_APP_ID__',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification ?? {};
  if (!title) return;
  self.registration.showNotification(title, {
    body: body ?? '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: payload.data ?? {},
    vibrate: [200, 100, 200],
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.actionUrl || '/notifications';
  event.waitUntil(clients.openWindow(url));
});
