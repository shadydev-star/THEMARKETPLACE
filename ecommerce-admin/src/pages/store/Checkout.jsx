import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../../styles/store.css";
import formatCurrency from "../../utils/formatCurrency";
import { useCart } from "../../context/CartContext"; // ✅ import the shared context

export default function Checkout() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { carts, clearCart } = useCart(); // ✅ access context functions
  const cart = carts[slug] || [];

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    payment: "cash",
  });

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * (item.quantity || 1),
    0
  );

  const handleSubmit = (e) => {
    e.preventDefault();

    // TODO: Save order to Firestore later
    console.log("Order placed:", {
      wholesaler: slug,
      customer: form,
      items: cart,
      total: subtotal,
    });

    clearCart(slug); // ✅ empty this wholesaler’s cart only
    navigate(`/store/${slug}/thank-you`);
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
        <button type="submit" className="btn place-order-btn">
          Place Order
        </button>
      </form>
    </div>
  );
}
