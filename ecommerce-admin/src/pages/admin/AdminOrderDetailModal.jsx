// src/pages/admin/AdminOrderDetailModal.jsx
import { useState } from "react";
import { db } from "../../firebase";
import { doc, updateDoc } from "firebase/firestore";
import formatCurrency from "../../utils/formatCurrency";

export default function AdminOrderDetailModal({ order, onClose, currentUser }) {
  const [status, setStatus] = useState(order.status);
  const [updating, setUpdating] = useState(false);
  const [updated, setUpdated] = useState(false);

  const handleStatusUpdate = async () => {
    if (!currentUser) return;
    setUpdating(true);
    try {
      const orderRef = doc(db, "wholesalers", currentUser.uid, "orders", order.id);
      await updateDoc(orderRef, { status });

      // update customer order if exists
      if (order.customerOrderPath) {
        const customerOrderRef = doc(db, order.customerOrderPath);
        await updateDoc(customerOrderRef, { status });
      }

      setUpdated(true);
      setTimeout(() => {
        setUpdated(false);
        onClose();
      }, 1200);
    } catch (error) {
      console.error("❌ Error updating order:", error);
      alert("Failed to update order.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
      >
        <div className="modal-header">
          <h3>Update Order</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <p><strong>Order ID:</strong> {order.id}</p>
          <p><strong>Customer:</strong> {order.customerInfo?.name}</p>
          <p><strong>Phone:</strong> {order.customerInfo?.phone}</p>
          <p><strong>Address:</strong> {order.customerInfo?.address}</p>
          <p><strong>Total:</strong> {formatCurrency(order.total)}</p>

          <h4>Items</h4>
          <ul>
            {order.items?.map((item, i) => (
              <li key={i}>
                {item.name} × {item.quantity} — {formatCurrency(item.price * item.quantity)}
              </li>
            ))}
          </ul>

          <div className="status-update">
            <label>Status:</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} disabled={updating}>
              <option value="pending">Pending</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="status-btn"
            onClick={handleStatusUpdate}
            disabled={updating}
          >
            {updating ? "Updating..." : updated ? "Updated!" : "Update Status"}
          </button>
          <button className="close-btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
