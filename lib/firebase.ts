// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyARdK4OYZ04cweeVHSTrrU-74cm4Xf6nIo",
  authDomain: "eventcash-74a3a.firebaseapp.com",
  projectId: "eventcash-74a3a",
  storageBucket: "eventcash-74a3a.firebasestorage.app",
  messagingSenderId: "670848651839",
  appId: "1:670848651839:web:0c1b1d912708aa87765e8a",
  measurementId: "G-5HWTP0HKF3"
};

// Validate configuration
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error('Firebase configuration is incomplete. Please check your environment variables.');
}

// Initialize Firebase (only once)
let app;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  console.log('Firebase initialized successfully');
  console.log('Project ID:', firebaseConfig.projectId);
  console.log('Auth Domain:', firebaseConfig.authDomain);
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error;
}

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Set persistence to LOCAL (survives browser restarts and page refreshes)
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      console.log('Firebase Auth persistence set to LOCAL');
    })
    .catch((error) => {
      console.error('Error setting auth persistence:', error);
    });
}

// Log auth configuration
console.log('Auth instance created');
console.log('Auth app name:', auth.app.name);
console.log('Auth config:', auth.config);

// Initialize Analytics only on client side
export const analytics = typeof window !== 'undefined' && isSupported() ? getAnalytics(app) : null;

export default app;
