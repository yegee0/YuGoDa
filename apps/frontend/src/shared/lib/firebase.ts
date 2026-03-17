import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

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

const customerApp = initializeApp(customerConfig, "customer");
const partnerApp = initializeApp(partnerConfig, "partner");
const adminApp = initializeApp(adminConfig, "admin");

export const authCustomer = getAuth(customerApp);
export const authPartner = getAuth(partnerApp);
export const authAdmin = getAuth(adminApp);
