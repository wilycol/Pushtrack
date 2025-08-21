import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";

// --- CONFIGURATION ---
// IMPORTANT: Replace with your Firebase project's configuration.
// You can find this in your Firebase project settings.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  appId: "YOUR_APP_ID",
};

// These are the credentials for the initial admin account.
// Use the "Ensure Admin" button on the login page once to create it.
// IMPORTANT: The admin should change this password after the first login.
export const ADMIN_EMAIL = "admin@pushtrack.io";
export const ADMIN_PASSWORD = "changeThisPassword123";

// --- INITIALIZATION ---
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Set session persistence to keep users logged in
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error("Firebase persistence error:", error.code, error.message);
  });
