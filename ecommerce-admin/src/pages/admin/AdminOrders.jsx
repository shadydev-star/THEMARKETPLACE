import { useState, useEffect } from "react";
import "../../styles/orders.css";
import formatCurrency from "../../utils/formatCurrency";
import { db } from "../../firebase";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import { useAuth } from "../auth/AuthContext";

export default function Orders() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  // 🔄 Real-time listener
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "wholesalers", currentUser.uid, "orders"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedOrders = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(fetchedOrders);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching orders:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // 🧠 Update Status + Sync to Customer
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, "wholesalers", currentUser.uid, "orders", orderId);
      await updateDoc(orderRef, { status: newStatus });

      const changedOrder = orders.find((o) => o.id === orderId);
      if (changedOrder?.customerOrderPath) {
        const customerRef = doc(db, changedOrder.customerOrderPath);
        await updateDoc(customerRef, { status: newStatus });
      }

      console.log("✅ Order status updated:", newStatus);
    } catch (err) {
      console.error("❌ Error updating status:", err);
      alert("Failed to update order status.");
    }
  };

  // 🔍 Filter + search
  const filteredOrders = orders.filter((order) => {
    const matchSearch =
      order.id.toLowerCase().includes(search.toLowerCase()) ||
      order.customerInfo?.name?.toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter ? order.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  if (loading) return <p className="loading">Loading orders...</p>;

  return (
    <div className="admin-orders-page">
      <h2>Orders</h2>

      {/* 🔍 Controls */}
      <div className="orders-controls">
        <input
          type="text"
          placeholder="Search by customer or ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
        </select>
      </div>

      {/* ⚡ Quick Filters */}
      <div className="quick-filters">
        {["pending", "shipped", "delivered"].map((s) => (
          <button
            key={s}
            className={statusFilter === s ? "active" : ""}
            onClick={() => setStatusFilter(statusFilter === s ? "" : s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* 🧾 Orders Table */}
      <table className="orders-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Status</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.customerInfo?.name || "Unknown"}</td>
                <td>
                  {order.createdAt?.toDate
                    ? order.createdAt.toDate().toLocaleString()
                    : "—"}
                </td>
                <td>
                  <select
                    className={`status-dropdown ${order.status}`}
                    value={order.status}
                    onChange={(e) =>
                      handleStatusChange(order.id, e.target.value)
                    }
                  >
                    <option value="pending">Pending</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </td>
                <td>{formatCurrency(order.total)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={{ textAlign: "center" }}>
                No orders found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* 📱 Mobile Card View */}
      <div className="orders-cards">
        {filteredOrders.map((order) => (
          <div className="order-card" key={order.id}>
            <h4>Order #{order.id}</h4>
            <p>
              <strong>Customer:</strong> {order.customerInfo?.name}
            </p>
            <p>
              <strong>Date:</strong>{" "}
              {order.createdAt?.toDate?.().toLocaleString()}
            </p>
            <p>
              <strong>Total:</strong> {formatCurrency(order.total)}
            </p>

            <select
              className={`status-dropdown ${order.status}`}
              value={order.status}
              onChange={(e) => handleStatusChange(order.id, e.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
