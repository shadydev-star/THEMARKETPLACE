import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import "../../styles/storeorders.css";
import { db } from "../../firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { useCustomerAuth } from "../auth/CustomerAuthContext";
import formatCurrency from "../../utils/formatCurrency";

export default function CustomerOrders() {
  const { slug } = useParams();
  const { customer } = useCustomerAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customer) return;

    const ordersRef = collection(db, "customers", customer.uid, "orders");
    const q = query(ordersRef, where("storeSlug", "==", slug), orderBy("createdAt", "desc"));

    // 👇 Real-time listener
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(data);
        setLoading(false);
      },
      (error) => {
        console.error("🔥 Error listening for orders:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe(); // Cleanup listener
  }, [slug, customer]);

  if (loading)
    return (
      <div className="store-orders-page">
        <div className="orders-loading">Loading your orders...</div>
      </div>
    );

  if (orders.length === 0)
    return (
      <div className="store-orders-page">
        <div className="orders-empty">
          <h2>No Orders Yet</h2>
          <p>You haven’t placed any orders from this store.</p>
          <Link to={`/store/${slug}`} className="btn back-store-btn">
            ← Back to Storefront
          </Link>
        </div>
      </div>
    );

  return (
    <div className="store-orders-page">
      <div className="orders-header">
        <h2>Your Orders</h2>
        <Link to={`/store/${slug}`} className="btn back-store-btn">
          ← Back to Storefront
        </Link>
      </div>

      <div className="orders-list">
        {orders.map((order) => (
          <div key={order.id} className="order-card">
            <div className="order-header">
              <h4>Order #{order.id.slice(0, 6).toUpperCase()}</h4>
              <span className={`order-status ${order.status}`}>{order.status}</span>
            </div>
            <p className="order-date">
              {order.createdAt?.seconds
                ? new Date(order.createdAt.seconds * 1000).toLocaleString()
                : "Unknown date"}
            </p>
            <ul className="order-items">
              {order.items?.map((item, index) => (
                <li key={index}>
                  {item.name} × {item.quantity} —{" "}
                  {formatCurrency(item.price * item.quantity)}
                </li>
              ))}
            </ul>
            <div className="order-total">
              <strong>Total: </strong> {formatCurrency(order.total)}
            </div>
            <Link
              to={`/store/${slug}/orders/${order.id}`}
              className="btn view-details-btn"
            >
              View Details →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
