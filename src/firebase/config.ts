import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "dummy-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dummy-auth-domain.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dummy-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dummy-storage-bucket.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "dummy-sender-id",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "dummy-app-id",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "dummy-measurement-id"
};

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
export const isMockMode = 
  !apiKey || 
  apiKey === 'dummy-api-key' ||
  (typeof apiKey === 'string' && apiKey.includes('your_')) ||
  (typeof apiKey === 'string' && apiKey.includes('placeholder'));



let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;
let googleProvider: any = null;

if (!isMockMode) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    googleProvider = new GoogleAuthProvider();
  } catch (error) {
    console.error("Firebase initialization failed, falling back to Mock Mode:", error);
  }
}

export { app, auth, db, storage, googleProvider };
export default app;
