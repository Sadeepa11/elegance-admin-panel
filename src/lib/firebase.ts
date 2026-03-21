import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getAuth, setPersistence, browserSessionPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD4KeTB42wT1bG9nAkOT11DTDinCO87vq0",
  authDomain: "elegancenew-64a67.firebaseapp.com",
  projectId: "elegancenew-64a67",
  storageBucket: "elegancenew-64a67.firebasestorage.app",
  messagingSenderId: "608776197551",
  appId: "1:608776197551:web:0e0f1d4ddd455e62ad4b5a",
  measurementId: "G-P2Z3F07KQW"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const rtdb = getDatabase(app, process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL);
const auth = getAuth(app);

// Set persistence to session (logout when tab/window is closed)
setPersistence(auth, browserSessionPersistence);

export { app, db, rtdb, auth };
