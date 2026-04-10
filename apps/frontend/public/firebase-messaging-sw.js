importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Must match the project used by the backend Firebase Admin SDK (yugoda-5b36a)
// so that FCM tokens are issued by the same project that sends the messages.
firebase.initializeApp({
  apiKey: 'AIzaSyApt9ndLXpv5Jorv7_0YvOb0BNXW1BAXds',
  authDomain: 'yugoda-5b36a.firebaseapp.com',
  projectId: 'yugoda-5b36a',
  storageBucket: 'yugoda-5b36a.firebasestorage.app',
  messagingSenderId: '321146319924',
  appId: '1:321146319924:web:1300f7fce2a3007c100661',
});

const messaging = firebase.messaging();

// Handle background messages (app is in background or closed)
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? 'YuGoDa';
  const body  = payload.notification?.body  ?? '';
  self.registration.showNotification(title, {
    body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
  });
});
