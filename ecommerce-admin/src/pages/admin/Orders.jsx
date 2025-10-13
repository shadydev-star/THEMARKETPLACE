// src/pages/admin/Orders.jsx
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
  const { currentUser } = useAuth(); // Wholesaler
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
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

    // 🧹 Clean up listener when component unmounts
    return () => unsubscribe();
  }, [currentUser]);

  // 🔍 Filter + search
  const filteredOrders = orders.filter((order) => {
    const matchSearch =
      order.id.toLowerCase().includes(search.toLowerCase()) ||
      order.customerInfo?.name
        ?.toLowerCase()
        .includes(search.toLowerCase());

    const matchStatus = statusFilter
      ? order.status === statusFilter
      : true;

    return matchSearch && matchStatus;
  });

  if (loading) {
    return <p className="loading">Loading orders...</p>;
  }

  return (
    <div className="orders-page">
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

      {/* 🧾 Orders Table */}
      <table className="orders-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Status</th>
            <th>Total</th>
            <th>Action</th>
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
                  <span className={`status ${order.status}`}>
                    {order.status}
                  </span>
                </td>
                <td>{formatCurrency(order.total)}</td>
                <td>
                  <button onClick={() => setSelectedOrder(order)}>View</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" style={{ textAlign: "center" }}>
                No orders found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {selectedOrder && (
        <OrderModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}

function OrderModal({ order, onClose, currentUser }) {
  const [status, setStatus] = useState(order.status);
  const [updating, setUpdating] = useState(false);

  const handleStatusUpdate = async () => {
    if (!currentUser) return;
    setUpdating(true);
    try {
      const orderRef = doc(
        db,
        "wholesalers",
        currentUser.uid,
        "orders",
        order.id
      );
      await updateDoc(orderRef, { status });
      alert("✅ Order status updated!");
      onClose();
    } catch (error) {
      console.error("Error updating order:", error);
      alert("❌ Failed to update status.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>Order Details</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <p><strong>Order ID:</strong> {order.id}</p>
          <p><strong>Customer:</strong> {order.customerInfo?.name}</p>
          <p><strong>Phone:</strong> {order.customerInfo?.phone}</p>
          <p><strong>Address:</strong> {order.customerInfo?.address}</p>
          <hr />
          <p><strong>Payment:</strong> {order.customerInfo?.payment}</p>
          <p><strong>Status:</strong> {order.status}</p>
          <p><strong>Total:</strong> {formatCurrency(order.total)}</p>

          <h4>Items</h4>
          <table className="items-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, i) => (
                <tr key={i}>
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.price)}</td>
                  <td>{formatCurrency(item.price * (item.quantity || 1))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="modal-footer">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={updating}
          >
            <option value="pending">Pending</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
          </select>

          <button
            className="status-btn"
            onClick={handleStatusUpdate}
            disabled={updating}
          >
            {updating ? "Updating..." : "Update Status"}
          </button>

          <button className="close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
