import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDspQUM5ih87vrKeVXGkFqi1YypHlbcZlM",
  authDomain: "lottery-application-136.firebaseapp.com",
  databaseURL: "https://lottery-application-136-default-rtdb.firebaseio.com",
  projectId: "lottery-application-136",
  storageBucket: "lottery-application-136.firebasestorage.app",
  messagingSenderId: "1040005504976",
  appId: "1:1040005504976:web:94290a16e22610a0ece3d5",
  measurementId: "G-KMCWVS30BJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Optimized for Capacitor/Mobile: Force Long Polling to prevent 400/Aborted errors on unstable networks
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
});
const rtdb = getDatabase(app);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export { app, auth, db, rtdb, analytics };
