import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  // Store carts keyed by wholesaler slug: { nike: [...], adidas: [...] }
  const [carts, setCarts] = useState({});

  // ✅ Load from localStorage on app start
  useEffect(() => {
    const saved = localStorage.getItem("multiStoreCarts");
    if (saved) {
      setCarts(JSON.parse(saved));
    }
  }, []);

  // ✅ Save to localStorage whenever carts change
  useEffect(() => {
    localStorage.setItem("multiStoreCarts", JSON.stringify(carts));
  }, [carts]);

  // 🛒 Add product to a specific store's cart
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

      return { ...prev, [slug]: updated };
    });
  };

  // ❌ Remove product from a store's cart
  const removeFromCart = (slug, id) => {
    setCarts((prev) => ({
      ...prev,
      [slug]: prev[slug]?.filter((item) => item.id !== id) || [],
    }));
  };

  // 🔄 Update item quantity
  const updateQuantity = (slug, id, qty) => {
    if (qty < 1) return;
    setCarts((prev) => ({
      ...prev,
      [slug]: prev[slug]?.map((item) =>
        item.id === id ? { ...item, quantity: qty } : item
      ) || [],
    }));
  };

  // 🧹 Clear a store's cart (useful after checkout)
  const clearCart = (slug) => {
    setCarts((prev) => {
      const updated = { ...prev };
      delete updated[slug];
      return updated;
    });
  };

  return (
    <CartContext.Provider
      value={{ carts, addToCart, removeFromCart, updateQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

// Hook for using cart context
export function useCart() {
  return useContext(CartContext);
}
