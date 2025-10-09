// src/context/CartContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useCustomerAuth } from "../pages/auth/CustomerAuthContext";

const CartContext = createContext();

export function CartProvider({ children }) {
  const { currentCustomer } = useCustomerAuth() || {}; // ✅ safe destructuring
  const [carts, setCarts] = useState({});
  const [showToast, setShowToast] = useState(false); // ✅ animation state

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("multiStoreCarts");
    if (saved) setCarts(JSON.parse(saved));
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("multiStoreCarts", JSON.stringify(carts));
  }, [carts]);

  // Load cart from Firestore when customer logs in
  useEffect(() => {
    if (!currentCustomer) return;
    const loadCart = async () => {
      const ref = doc(db, "customers", currentCustomer.uid);
      const snap = await getDoc(ref);
      if (snap.exists() && snap.data().carts) {
        setCarts((prev) => ({ ...prev, ...snap.data().carts }));
      }
    };
    loadCart();
  }, [currentCustomer]);

  // Save to Firestore
  const saveToFirestore = async (updatedCarts) => {
    if (!currentCustomer) return;
    const ref = doc(db, "customers", currentCustomer.uid);
    await setDoc(ref, { carts: updatedCarts }, { merge: true });
  };

  // ✅ Add to cart with toast
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

    // 🔔 Trigger toast animation
    setShowToast(true);
    setTimeout(() => setShowToast(false), 1200);
  };

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

  const clearCart = (slug) => {
    setCarts((prev) => {
      const newCarts = { ...prev };
      delete newCarts[slug];
      saveToFirestore(newCarts);
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
        showToast, // ✅ include toast flag for Storefront
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
