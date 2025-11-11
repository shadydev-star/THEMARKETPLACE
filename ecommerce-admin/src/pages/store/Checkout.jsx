// src/pages/store/Checkout.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import "../../styles/checkout.css";
import formatCurrency from "../../utils/formatCurrency";
import { useCart } from "../../context/CartContext";
import { db } from "../../firebase";
import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  setDoc,
  doc,
  getDoc,
} from "firebase/firestore"; // Added getDoc import
import { useCustomerAuth } from "../auth/CustomerAuthContext";

export default function Checkout() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { carts, clearCart } = useCart();
  const { customer } = useCustomerAuth();
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

  const shippingFee = 0; // Free shipping
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + shippingFee + tax;

  // 🔍 Fetch wholesaler by slug
  useEffect(() => {
    const fetchWholesaler = async () => {
      const q = query(collection(db, "wholesalers"), where("slug", "==", slug));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) setWholesalerId(snapshot.docs[0].id);
    };
    fetchWholesaler();
  }, [slug]);

  // ✅ Check if order notifications are enabled
  const shouldCreateOrderNotification = async (userId) => {
    try {
      const settingsRef = doc(db, "wholesalers", userId, "settings", "preferences");
      const settingsSnap = await getDoc(settingsRef);
      
      if (settingsSnap.exists()) {
        const settings = settingsSnap.data().notifications;
        return settings.orderAlerts; // Return the orderAlerts setting
      }
      
      return true; // Default to true if no settings exist
    } catch (error) {
      console.error("Error checking notification settings:", error);
      return true; // Default to true on error
    }
  };

  // ✅ Save order (shared between cash + Paystack)
  const saveOrder = async (paymentStatus = "pending", reference = null) => {
    if (!wholesalerId || !customer) return;

    const orderRef = doc(collection(db, "wholesalers", wholesalerId, "orders"));
    const orderId = orderRef.id;

    const orderData = {
      id: orderId,
      customerId: customer.uid,
      customerInfo: form,
      items: cart,
      subtotal: subtotal,
      shipping: shippingFee,
      tax: tax,
      total: total,
      status: paymentStatus === "success" ? "confirmed" : "pending",
      payment: form.payment,
      paymentReference: reference,
      createdAt: Timestamp.now(),
      storeSlug: slug,
    };

    const wholesalerOrderPath = `wholesalers/${wholesalerId}/orders/${orderId}`;
    const customerOrderPath = `customers/${customer.uid}/orders/${orderId}`;

    await setDoc(orderRef, {
      ...orderData,
      customerOrderPath,
      customerUid: customer.uid,
    });

    const customerOrderRef = doc(
      db,
      "customers",
      customer.uid,
      "orders",
      orderId
    );
    await setDoc(customerOrderRef, {
      ...orderData,
      wholesalerOrderPath,
      wholesalerId,
    });

    // ✅ CHECK NOTIFICATION SETTINGS BEFORE CREATING NOTIFICATION
    const shouldNotify = await shouldCreateOrderNotification(wholesalerId);
    
    if (shouldNotify) {
      const notificationRef = collection(
        db,
        "wholesalers",
        wholesalerId,
        "notifications"
      );
      await addDoc(notificationRef, {
        title: "🛒 New Order Received!", // Added title for better structure
        message: `New order from ${form.name || "a customer"} (${form.phone}) - ${formatCurrency(total)}`,
        type: 'order', // Added type for filtering
        orderId,
        read: false,
        createdAt: Timestamp.now(),
      });
      console.log('Order notification created');
    } else {
      console.log('Order notifications are disabled, skipping notification');
    }

    clearCart(slug);
    navigate(`/store/${slug}/thank-you`, { state: { order: orderData } });
  };

  // 🧾 Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!customer) return alert("Please log in to place an order.");
    if (!wholesalerId) return alert("Store not found. Please try again later.");

    // Validate form
    if (!form.name || !form.phone || !form.address) {
      alert("Please fill in all required fields.");
      return;
    }

    setLoading(true);

    try {
      if (form.payment === "cash") {
        // Cash on delivery - create order immediately
        await saveOrder("pending");
      } else {
        // Bank transfer or card - use Paystack
        handlePaystackPayment();
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 💳 Paystack Inline Checkout
  const handlePaystackPayment = () => {
    if (!window.PaystackPop) {
      console.error("Paystack script not loaded yet.");
      alert("Payment service not ready yet. Please refresh and try again.");
      return;
    }

    const amountInKobo = total * 100;

    // Create temporary order first for reference
    const tempOrderId = `temp_${Date.now()}`;

    const handler = window.PaystackPop.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
      email: customer?.email || "customer@example.com",
      amount: amountInKobo,
      currency: "NGN",
      ref: tempOrderId,
      metadata: {
        custom_fields: [
          {
            display_name: "Customer Name",
            variable_name: "customer_name",
            value: form.name
          },
          {
            display_name: "Phone",
            variable_name: "phone",
            value: form.phone
          },
          {
            display_name: "Store",
            variable_name: "store_slug",
            value: slug
          }
        ]
      },
      callback: (response) => {
        console.log("Payment successful:", response);
        // Payment successful - save order with success status
        saveOrder("success", response.reference);
      },
      onClose: () => {
        console.log("Payment window closed.");
        // User closed the payment window - you might want to handle this differently
        // For now, we'll just show a message
        alert("Payment was not completed. You can try again.");
      },
    });

    handler.openIframe();
  };

  // Get button text based on payment method
  const getButtonText = () => {
    if (loading) {
      return form.payment === "cash" ? "Placing Order..." : "Processing...";
    }
    
    if (form.payment === "cash") {
      return `Place Order - ${formatCurrency(total)}`;
    } else {
      return `Pay ${formatCurrency(total)}`;
    }
  };

  // Get button icon based on payment method
  const getButtonIcon = () => {
    if (form.payment === "cash") {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    } else {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M20 9V7a2 2 0 00-2-2H6a2 2 0 00-2 2v2m16 0v8a2 2 0 01-2 2H6a2 2 0 01-2-2V9m16 0H4" 
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    }
  };

  if (cart.length === 0) {
    return (
      <div className="modern-checkout-page">
        <div className="empty-checkout-state">
          <div className="empty-cart-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <path d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5.5M7 13l-2.5 5.5m0 0L6 21h12m0 0a2 2 0 100-4 2 2 0 000 4zm-8-8a2 2 0 100-4 2 2 0 000 4z" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2>Your cart is empty</h2>
          <p>Please add items before checking out.</p>
          <Link to={`/store/${slug}`} className="continue-shopping-btn">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-checkout-page">
      {/* Header Section */}
      <div className="checkout-header">
        <div className="breadcrumb-nav">
          
          <Link to={`/store/${slug}`} className="breadcrumb-link">{slug}</Link>
          <span className="breadcrumb-separator">/</span>
          <Link to={`/store/${slug}/cart`} className="breadcrumb-link">Cart</Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">Checkout</span>
        </div>
        
        <div className="checkout-title-section">
          <h1 className="checkout-main-title">Checkout</h1>
          <div className="checkout-steps">
            <span className="step active">Cart</span>
            <span className="step-divider">›</span>
            <span className="step active">Information</span>
            <span className="step-divider">›</span>
            <span className="step">Shipping</span>
            <span className="step-divider">›</span>
            <span className="step">Payment</span>
          </div>
        </div>
      </div>

      <div className="checkout-layout">
        {/* Left Column - Checkout Form */}
        <div className="checkout-form-section">
          <div className="form-section-card">
            <h2 className="form-section-title">Contact Information</h2>
            <form className="checkout-form-modern" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    required
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Delivery Address *</label>
                <textarea
                  className="form-textarea"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  required
                  placeholder="Enter your complete delivery address"
                  rows="4"
                ></textarea>
              </div>

              <div className="form-section">
                <h2 className="form-section-title">Payment Method</h2>
                <div className="payment-options">
                  <label className="payment-option">
                    <input
                      type="radio"
                      name="payment"
                      value="cash"
                      checked={form.payment === "cash"}
                      onChange={(e) => setForm({ ...form, payment: e.target.value })}
                    />
                    <div className="payment-option-content">
                      <div className="payment-option-header">
                        <span className="payment-method-name">Cash on Delivery</span>
                        <div className="payment-icon">💵</div>
                      </div>
                      <p className="payment-description">Pay when you receive your order</p>
                    </div>
                  </label>

                  <label className="payment-option">
                    <input
                      type="radio"
                      name="payment"
                      value="transfer"
                      checked={form.payment === "transfer"}
                      onChange={(e) => setForm({ ...form, payment: e.target.value })}
                    />
                    <div className="payment-option-content">
                      <div className="payment-option-header">
                        <span className="payment-method-name">Bank Transfer</span>
                        <div className="payment-icon">🏦</div>
                      </div>
                      <p className="payment-description">Secure bank transfer via Paystack</p>
                    </div>
                  </label>

                  <label className="payment-option">
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={form.payment === "card"}
                      onChange={(e) => setForm({ ...form, payment: e.target.value })}
                    />
                    <div className="payment-option-content">
                      <div className="payment-option-header">
                        <span className="payment-method-name">Debit/Credit Card</span>
                        <div className="payment-icon">💳</div>
                      </div>
                      <p className="payment-description">Pay securely with your card via Paystack</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Hidden submit button for form submission */}
              <button type="submit" style={{ display: 'none' }}></button>
            </form>
          </div>

          {/* Order Items Summary */}
          <div className="order-items-card">
            <h2 className="form-section-title">Order Items</h2>
            <div className="order-items-list">
              {cart.map((item) => (
                <div key={item.id} className="order-item">
                  <div className="order-item-image">
                    <img
                      src={item.image || item.img || "https://via.placeholder.com/60?text=No+Image"}
                      alt={item.name}
                    />
                  </div>
                  <div className="order-item-details">
                    <h4 className="order-item-name">{item.name}</h4>
                    {item.selectedColor && (
                      <span className="order-item-variant">Color: {item.selectedColor}</span>
                    )}
                    {item.selectedSize && (
                      <span className="order-item-variant">Size: {item.selectedSize}</span>
                    )}
                    <div className="order-item-meta">
                      <span className="order-item-quantity">Qty: {item.quantity || 1}</span>
                      <span className="order-item-price">{formatCurrency(item.price * (item.quantity || 1))}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Order Summary */}
        <div className="order-summary-section">
          <div className="order-summary-card">
            <h3 className="summary-title">Order Summary</h3>
            
            <div className="summary-line">
              <span>Subtotal ({cart.length} {cart.length === 1 ? 'item' : 'items'})</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>

            <div className="summary-line">
              <span>Shipping</span>
              <span className="free-shipping">Free</span>
            </div>

            <div className="summary-line">
              <span>Tax</span>
              <span>{formatCurrency(tax)}</span>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-total">
              <span>Total</span>
              <span className="total-amount">{formatCurrency(total)}</span>
            </div>

            {/* Single checkout button that handles all payment methods */}
            <button 
              type="button"
              className={`checkout-btn ${
                form.payment === "cash" ? "place-order-btn" : "paystack-btn"
              }`}
              onClick={handleSubmit}
              disabled={loading}
            >
              {getButtonIcon()}
              {getButtonText()}
            </button>

            <div className="security-notice">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span>Your payment information is secure and encrypted</span>
            </div>

            <div className="return-policy">
              <h4>Return Policy</h4>
              <p>30-day money-back guarantee. Free returns within 14 days of delivery.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}