// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your config from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyAQY9guRvm1YwEMOi0GqITEkfY3nhtehGs",
  authDomain: "themarketplace-7315f.firebaseapp.com",
  projectId: "themarketplace-7315f",
  storageBucket: "themarketplace-7315f.firebasestorage.app",
  messagingSenderId: "48104809799",
  appId: "1:48104809799:web:868d325a44adf995c39862",
  measurementId: "G-LFY52RXVXZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
