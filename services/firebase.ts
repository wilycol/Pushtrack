// src/services/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

for (const [k, v] of Object.entries(firebaseConfig)) {
  if (!v) console.error(`Firebase config missing: ${k}`);
}

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);

setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Firebase persistence error:", error.code, error.message);
});

export const ADMIN_EMAIL = "admin@pushtrack.io";
export const ADMIN_PASSWORD = "changeThisPassword123";
