import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import rawConfig from '../../../../backend/firebase-applet-config.json';

const { firestoreDatabaseId, ...firebaseConfig } = rawConfig;

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firestoreDatabaseId);

export default app;
