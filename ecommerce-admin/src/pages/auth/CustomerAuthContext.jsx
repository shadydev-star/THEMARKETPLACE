import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

const CustomerAuthContext = createContext();

export function CustomerAuthProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Track customer login state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const ref = doc(db, "customers", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setCustomer({ uid: user.uid, ...snap.data() });
        } else {
          setCustomer(user);
        }
      } else {
        setCustomer(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // ✅ Sign up customer under wholesaler's slug
  async function customerSignup(name, email, password, slug) {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const ref = doc(db, "customers", userCred.user.uid);

    await setDoc(ref, {
      name,
      email,
      storeSlug: slug,
      createdAt: new Date(),
    });

    setCustomer({ uid: userCred.user.uid, name, email, storeSlug: slug });
  }

  // ✅ Customer login
  async function customerLogin(email, password) {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const ref = doc(db, "customers", userCred.user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error("Customer data not found");
    const customerData = { uid: userCred.user.uid, ...snap.data() };
    setCustomer(customerData);
    return customerData.storeSlug;
  }

  // ✅ Logout
  async function customerLogout() {
    await signOut(auth);
    setCustomer(null);
  }

  const value = {
    customer,
    customerSignup,
    customerLogin,
    customerLogout,
  };

  return (
    <CustomerAuthContext.Provider value={value}>
      {!loading && children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  return useContext(CustomerAuthContext);
}
