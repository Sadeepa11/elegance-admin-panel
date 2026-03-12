import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getAuth, setPersistence, browserSessionPersistence } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDwXfrzsKa_o5Nfin6HbPPk9u7O5JPJgpw",
    authDomain: "elegance-9d812.firebaseapp.com",
    projectId: "elegance-9d812",
    storageBucket: "elegance-9d812.firebasestorage.app",
    messagingSenderId: "227820709837",
    appId: "1:227820709837:web:c5fb4158d3c7102dee4684",
    measurementId: "G-TV2B27W1NH"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const rtdb = getDatabase(app);
const auth = getAuth(app);

// Set persistence to session (logout when tab/window is closed)
setPersistence(auth, browserSessionPersistence);

export { app, db, rtdb, auth };
