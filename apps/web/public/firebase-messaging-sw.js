importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            self.__FIREBASE_API_KEY__        || '',
  authDomain:        self.__FIREBASE_AUTH_DOMAIN__    || '',
  projectId:         self.__FIREBASE_PROJECT_ID__     || '',
  storageBucket:     self.__FIREBASE_STORAGE_BUCKET__ || '',
  messagingSenderId: self.__FIREBASE_MESSAGING_SENDER_ID__ || '',
  appId:             self.__FIREBASE_APP_ID__         || '',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification ?? {};
  if (!title) return;
  self.registration.showNotification(title, {
    body: body ?? '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: payload.data ?? {},
    vibrate: [200, 100, 200],
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.actionUrl || '/notifications';
  event.waitUntil(clients.openWindow(url));
});
