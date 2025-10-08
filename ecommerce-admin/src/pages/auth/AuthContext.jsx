import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../../firebase";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Track logged-in user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // fetch user data from Firestore
        const ref = doc(db, "wholesalers", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setCurrentUser({ uid: user.uid, ...snap.data() });
        } else {
          setCurrentUser(user);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // ✅ Signup wholesaler
  async function signup(storeName, email, password) {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const slug = storeName.toLowerCase().replace(/\s+/g, "-");
    const ref = doc(db, "wholesalers", userCred.user.uid);
    await setDoc(ref, { storeName, email, slug, createdAt: new Date() });
    setCurrentUser({ uid: userCred.user.uid, storeName, email, slug });
    return slug;
  }

  // ✅ Login
  async function login(email, password) {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const ref = doc(db, "wholesalers", userCred.user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error("Wholesaler data not found");
    const userData = { uid: userCred.user.uid, ...snap.data() };
    setCurrentUser(userData);
    return userData.slug;
  }

  // ✅ Logout
  async function logout() {
    await signOut(auth);
    setCurrentUser(null);
  }

  const value = {
    currentUser,
    signup,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
