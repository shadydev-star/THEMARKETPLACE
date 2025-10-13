import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom"; // ✅ Added Link import
import "../../styles/storeorders.css";
import { db } from "../../firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { useCustomerAuth } from "../auth/CustomerAuthContext";
import formatCurrency from "../../utils/formatCurrency";

export default function CustomerOrders() {
  const { slug } = useParams(); 
  const { customer } = useCustomerAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!customer) {
        console.warn("⚠️ No logged-in customer, skipping fetch.");
        setOrders([]);
        setLoading(false);
        return;
      }

      try {
        console.log("📨 Fetching orders for customer:", customer.uid);
        console.log("🏪 Store slug:", slug);

        const ordersRef = collection(db, "customers", customer.uid, "orders");
        const q = query(
          ordersRef,
          where("storeSlug", "==", slug),
          orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          console.warn("❌ No orders found for this store.");
          setOrders([]);
          return;
        }

        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log("📦 Loaded customer orders:", data);
        setOrders(data);
      } catch (err) {
        console.error("🔥 Error fetching customer orders:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [slug, customer]);

  if (loading) return <div className="orders-page">Loading your orders...</div>;
  if (error)
    return (
      <div className="orders-page error">
        <h2>Something went wrong</h2>
        <p>{error}</p>
      </div>
    );
  if (orders.length === 0)
    return (
      <div className="orders-page">
        <h2>No Orders Yet</h2>
        <p>You haven’t placed any orders from this store.</p>
      </div>
    );

  return (
    <div className="orders-page">
      <h2>Your Orders</h2>
      <div className="orders-list">
        {orders.map((order) => (
          <div key={order.id} className="order-card">
            <div className="order-header">
              <h4>Order #{order.id.slice(0, 6).toUpperCase()}</h4>
              <span className={`order-status ${order.status}`}>
                {order.status}
              </span>
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
