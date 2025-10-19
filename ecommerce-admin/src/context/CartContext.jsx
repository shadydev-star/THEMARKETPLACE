// src/context/CartContext.jsx
import { createContext, useContext, useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useCustomerAuth } from "../pages/auth/CustomerAuthContext";

const CartContext = createContext();

export function CartProvider({ children }) {
  const { currentCustomer } = useCustomerAuth() || {};
  const [carts, setCarts] = useState({});
  const [showToast, setShowToast] = useState(false);
  const hasLoadedLocal = useRef(false);

  /** 🧩 Load carts from localStorage on first render */
  useEffect(() => {
    const saved = localStorage.getItem("multiStoreCarts");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCarts(parsed);
        console.log("🧩 Loaded carts from localStorage:", parsed);
      } catch (err) {
        console.error("❌ Error parsing localStorage carts:", err);
      }
    }
    hasLoadedLocal.current = true;
  }, []);

  /** 💾 Persist carts to localStorage (only after load) */
  useEffect(() => {
    if (!hasLoadedLocal.current) return;
    if (Object.keys(carts).length > 0) {
      localStorage.setItem("multiStoreCarts", JSON.stringify(carts));
    }
  }, [carts]);

  /** ☁️ Load Firestore cart when user logs in */
  useEffect(() => {
    if (!currentCustomer) return;
    const loadCart = async () => {
      try {
        const ref = doc(db, "customers", currentCustomer.uid);
        const snap = await getDoc(ref);
        if (snap.exists() && snap.data().carts) {
          const firestoreCarts = snap.data().carts;
          // ✅ merge Firestore carts into local ones without overwriting
          setCarts((prev) => ({ ...firestoreCarts, ...prev }));
          console.log("🔥 Merged Firestore carts:", firestoreCarts);
        }
      } catch (err) {
        console.error("❌ Error loading Firestore cart:", err);
      }
    };
    loadCart();
  }, [currentCustomer]);

  /** ☁️ Save to Firestore whenever carts change (if logged in) */
  const saveToFirestore = async (updatedCarts) => {
    if (!currentCustomer) return;
    try {
      const ref = doc(db, "customers", currentCustomer.uid);
      await setDoc(ref, { carts: updatedCarts }, { merge: true });
    } catch (err) {
      console.error("❌ Error saving to Firestore:", err);
    }
  };

  /** 🛒 Add product to cart */
  const addToCart = (slug, product) => {
    setCarts((prev) => {
      const storeCart = prev[slug] || [];
      const existing = storeCart.find((item) => item.id === product.id);
      const updated = existing
        ? storeCart.map((item) =>
            item.id === product.id
              ? { ...item, quantity: (item.quantity || 1) + 1 }
              : item
          )
        : [...storeCart, { ...product, quantity: 1 }];

      const newCarts = { ...prev, [slug]: updated };
      saveToFirestore(newCarts);
      return newCarts;
    });

    setShowToast(true);
    setTimeout(() => setShowToast(false), 1200);
  };

  /** 🗑️ Remove product */
  const removeFromCart = (slug, id) => {
    setCarts((prev) => {
      const newCarts = {
        ...prev,
        [slug]: (prev[slug] || []).filter((item) => item.id !== id),
      };
      saveToFirestore(newCarts);
      return newCarts;
    });
  };

  /** 🔄 Update quantity */
  const updateQuantity = (slug, id, qty) => {
    if (qty < 1) return;
    setCarts((prev) => {
      const newCarts = {
        ...prev,
        [slug]: prev[slug].map((i) =>
          i.id === id ? { ...i, quantity: qty } : i
        ),
      };
      saveToFirestore(newCarts);
      return newCarts;
    });
  };

  /** 🧹 Clear a store’s cart */
const clearCart = (slug) => {
  setCarts((prev) => {
    const newCarts = { ...prev };
    delete newCarts[slug];

    // 🧠 keep Firestore + localStorage in sync
    saveToFirestore(newCarts);
    localStorage.setItem("multiStoreCarts", JSON.stringify(newCarts));

    return newCarts;
  });
};


  return (
    <CartContext.Provider
      value={{
        carts,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        showToast,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
