import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const customerConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_CUSTOMER_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_CUSTOMER_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_CUSTOMER_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_CUSTOMER_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_CUSTOMER_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_CUSTOMER_APP_ID
};

const partnerConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_PARTNER_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_PARTNER_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PARTNER_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_PARTNER_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_PARTNER_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_PARTNER_APP_ID
};

const adminConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_ADMIN_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_ADMIN_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_ADMIN_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_ADMIN_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_ADMIN_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_ADMIN_APP_ID
};

// Messaging uses the backend Firebase project (yugoda-5b36a) so the Admin SDK
// and client tokens share the same project — required for FCM delivery to work.
const messagingConfig = {
  apiKey: 'AIzaSyApt9ndLXpv5Jorv7_0YvOb0BNXW1BAXds',
  authDomain: 'yugoda-5b36a.firebaseapp.com',
  projectId: 'yugoda-5b36a',
  storageBucket: 'yugoda-5b36a.firebasestorage.app',
  messagingSenderId: '321146319924',
  appId: '1:321146319924:web:1300f7fce2a3007c100661',
};

const customerApp = initializeApp(customerConfig, "customer");
const partnerApp = initializeApp(partnerConfig, "partner");
const adminApp = initializeApp(adminConfig, "admin");
const messagingApp = initializeApp(messagingConfig, "messaging");

export const authCustomer = getAuth(customerApp);
export const authPartner = getAuth(partnerApp);
export const authAdmin = getAuth(adminApp);

/**
 * Role-to-Firebase-auth map. The three Firebase projects are the authoritative
 * session stores for each role; the helpers below derive from this single map.
 */
const AUTH_BY_ROLE = {
  customer:   authCustomer,
  restaurant: authPartner,
  admin:      authAdmin,
} as const;

export type AuthRole = keyof typeof AUTH_BY_ROLE;

/**
 * Signs the user out of ALL three Firebase project sessions in parallel.
 * Used by the shared header logout control.
 */
export async function signOutAllProjects(): Promise<void> {
  await Promise.all(Object.values(AUTH_BY_ROLE).map(a => a.signOut()));
}

/**
 * Signs the user out of every Firebase project OTHER than `target`.
 * Called at the start of each sign-in flow so the incoming role is the only
 * live principal after authentication completes. Errors propagate — callers
 * should `await` this and abort the sign-in if it throws, per the plan's
 * "no cross-role token window" requirement.
 */
export async function signOutOtherProjects(target: AuthRole): Promise<void> {
  const others = (Object.keys(AUTH_BY_ROLE) as AuthRole[]).filter(r => r !== target);
  await Promise.all(others.map(r => AUTH_BY_ROLE[r].signOut()));
}

/**
 * Requests an FCM push token for the current customer session.
 * Returns null if the VAPID key is not configured or push permission is denied.
 *
 * Troubleshooting on localhost:
 *  - VITE_FIREBASE_VAPID_KEY must match the Web Push Certificate in the yugoda-5b36a project.
 *  - The browser must grant notification permission (check browser settings if the prompt never appears).
 *  - Service workers only work on localhost or HTTPS — plain http:// on other hosts won't work.
 */
export async function getCustomerFcmToken(): Promise<string | null> {
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;
  if (!vapidKey) {
    console.warn('[FCM] VITE_FIREBASE_VAPID_KEY is not set — push token registration skipped.');
    return null;
  }
  try {
    // Explicitly request notification permission so the outcome is visible in dev tools.
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[FCM] Notification permission denied — push token registration skipped.');
      return null;
    }

    const sw = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const messaging = getMessaging(messagingApp);
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: sw });
    if (!token) {
      console.warn('[FCM] getToken() returned empty — check that the VAPID key belongs to the yugoda-5b36a project.');
      return null;
    }
    console.info('[FCM] Token registered successfully.');
    return token;
  } catch (err) {
    console.error('[FCM] Token registration failed:', err);
    return null;
  }
}

/**
 * Listens for FCM messages while the customer app is in the foreground and shows
 * a browser Notification (background messages are handled by the service worker).
 * Call once after a customer logs in.
 */
export function listenForegroundMessages(): void {
  try {
    const messaging = getMessaging(messagingApp);
    onMessage(messaging, (payload) => {
      const title = payload.notification?.title ?? 'YuGoDa';
      const body  = payload.notification?.body  ?? '';
      if (Notification.permission === 'granted') {
        const orderId = payload.data?.orderId;
        const url = orderId ? `/profile?tab=orders&orderId=${orderId}` : '/profile?tab=orders';
        const notif = new Notification(title, { body, icon: '/favicon.ico' });
        notif.onclick = () => {
          window.focus();
          window.location.href = url;
          notif.close();
        };
      }
    });
  } catch (err) {
    console.error('[FCM] Failed to set up foreground message listener:', err);
  }
}
