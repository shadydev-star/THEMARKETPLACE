import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import "../../styles/storeorders.css";
import { db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useCustomerAuth } from "../auth/CustomerAuthContext";
import formatCurrency from "../../utils/formatCurrency";

export default function OrderDetails() {
  const { slug, orderId } = useParams();
  const { customer } = useCustomerAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!customer) {
        console.warn("⚠️ No customer logged in.");
        setLoading(false);
        return;
      }

      try {
        const ref = doc(db, "customers", customer.uid, "orders", orderId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setOrder({ id: snap.id, ...snap.data() });
        } else {
          console.warn("❌ Order not found.");
        }
      } catch (error) {
        console.error("Error fetching order details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [customer, orderId]);

  if (loading) return <div className="orders-page">Loading order details...</div>;
  if (!order)
    return (
      <div className="orders-page">
        <h2>Order not found</h2>
        <Link to={`/store/${slug}/orders`} className="btn">
          Back to Orders
        </Link>
      </div>
    );

  return (
    <div className="order-details-page">
      <h2>Order #{order.id.slice(0, 6).toUpperCase()}</h2>

      <p className="order-date">
        Placed on: {new Date(order.createdAt.seconds * 1000).toLocaleString()}
      </p>

      <p>
        <strong>Status:</strong>{" "}
        <span className={`order-status ${order.status}`}>{order.status}</span>
      </p>

      <h3>Items</h3>
      <ul className="order-items">
        {order.items.map((item, index) => (
          <li key={index}>
            <img src={item.image} alt={item.name} className="order-item-img" />
            <div>
              <p>
                <strong>{item.name}</strong>
              </p>
              <p>
                {item.quantity} × {formatCurrency(item.price)} ={" "}
                {formatCurrency(item.price * item.quantity)}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="order-total">
        <strong>Total: </strong> {formatCurrency(order.total)}
      </div>

      <h3>Delivery Info</h3>
      <p>
        <strong>Name:</strong> {order.customerInfo?.name}
      </p>
      <p>
        <strong>Phone:</strong> {order.customerInfo?.phone}
      </p>
      <p>
        <strong>Address:</strong> {order.customerInfo?.address}
      </p>

      <p>
        <strong>Payment Method:</strong> {order.payment}
      </p>

      <Link to={`/store/${slug}/orders`} className="btn back-btn">
        ← Back to Orders
      </Link>
    </div>
  );
}
