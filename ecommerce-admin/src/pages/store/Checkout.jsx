// src/pages/store/Checkout.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../../styles/store.css";
import formatCurrency from "../../utils/formatCurrency";
import { useCart } from "../../context/CartContext";
import { db } from "../../firebase";
import { addDoc, collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { useCustomerAuth } from "../auth/CustomerAuthContext";

export default function Checkout() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { carts, clearCart } = useCart();
  const { customer } = useCustomerAuth(); // ✅ Corrected
  const cart = carts[slug] || [];

  const [wholesalerId, setWholesalerId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    payment: "cash",
  });
  const [loading, setLoading] = useState(false);

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * (item.quantity || 1),
    0
  );

  // 🔍 Fetch wholesalerId by slug
  useEffect(() => {
    const fetchWholesaler = async () => {
      try {
        const q = query(collection(db, "wholesalers"), where("slug", "==", slug));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setWholesalerId(snapshot.docs[0].id);
        } else {
          console.warn("No wholesaler found for slug:", slug);
        }
      } catch (error) {
        console.error("Error fetching wholesaler:", error);
      }
    };
    fetchWholesaler();
  }, [slug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!wholesalerId) {
      alert("Store not found. Please try again later.");
      return;
    }

    setLoading(true);

    console.log("🧍 Current customer before placing order:", customer);

    const orderData = {
      customerId: customer?.uid || "guest",
      customerInfo: form,
      items: cart,
      total: subtotal,
      status: "pending",
      payment: form.payment,
      createdAt: Timestamp.now(),
    };

    try {
      // 🧾 Save to wholesaler's "orders" subcollection
      await addDoc(collection(db, "wholesalers", wholesalerId, "orders"), orderData);

      // 🧍 Save copy to customer's "orders" subcollection
      if (customer) {
        await addDoc(collection(db, "customers", customer.uid, "orders"), {
          storeSlug: slug,
          ...orderData,
        });
      }

      clearCart(slug);
      navigate(`/store/${slug}/thank-you`, { state: { order: orderData } });

    } catch (error) {
      console.error("❌ Error placing order:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="checkout-page">
        <h2>Your cart is empty</h2>
        <p>Please add items before checking out.</p>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <h2>Checkout</h2>

      <form className="checkout-form" onSubmit={handleSubmit}>
        <label>
          Full Name
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </label>

        <label>
          Phone Number
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
          />
        </label>

        <label>
          Delivery Address
          <textarea
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            required
          ></textarea>
        </label>

        <label>
          Payment Method
          <select
            value={form.payment}
            onChange={(e) => setForm({ ...form, payment: e.target.value })}
          >
            <option value="cash">Cash on Delivery</option>
            <option value="transfer">Bank Transfer</option>
            <option value="card">Debit Card</option>
          </select>
        </label>

        <h3>Total: {formatCurrency(subtotal)}</h3>

        <button type="submit" className="btn place-order-btn" disabled={loading}>
          {loading ? "Placing Order..." : "Place Order"}
        </button>
      </form>
    </div>
  );
}
