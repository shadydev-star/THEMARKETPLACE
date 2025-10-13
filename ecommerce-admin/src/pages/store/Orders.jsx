import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../../styles/store.css";
import { db } from "../../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useCustomerAuth } from "../auth/CustomerAuthContext";
import formatCurrency from "../../utils/formatCurrency";

export default function Orders() {
  const { slug } = useParams();
  const { currentCustomer } = useCustomerAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Fetch orders from the wholesaler’s subcollection
  useEffect(() => {
    const fetchOrders = async () => {
      if (!currentCustomer) return setLoading(false);

      try {
        // Get wholesalerId via slug
        const wholesalerSnap = await getDocs(
          query(collection(db, "wholesalers"), where("slug", "==", slug))
        );
        if (wholesalerSnap.empty) {
          setOrders([]);
          setLoading(false);
          return;
        }

        const wholesalerId = wholesalerSnap.docs[0].id;

        // Get only this customer's orders for this wholesaler
        const ordersRef = collection(db, "wholesalers", wholesalerId, "orders");
        const q = query(ordersRef, where("customerId", "==", currentCustomer.uid));
        const snap = await getDocs(q);

        const fetchedOrders = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setOrders(fetchedOrders);
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [slug, currentCustomer]);

  if (!currentCustomer) {
    return (
      <div className="orders-page">
        <h2>Please log in to view your orders.</h2>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="orders-page">
        <p>Loading your orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="orders-page">
        <h2>No orders yet</h2>
        <p>You haven’t placed any orders from this store.</p>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <h2>Your Orders</h2>
      <table className="orders-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Status</th>
            <th>Total</th>
            <th>Payment</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.id.slice(0, 6).toUpperCase()}</td>
              <td>
                <span className={`status ${order.status?.toLowerCase()}`}>
                  {order.status}
                </span>
              </td>
              <td>{formatCurrency(order.total)}</td>
              <td>{order.customerInfo?.payment || "N/A"}</td>
              <td>
                {order.createdAt?.toDate
                  ? order.createdAt.toDate().toLocaleDateString()
                  : new Date(order.createdAt).toLocaleDateString()}
              </td>
              <td>
                <button onClick={() => setSelectedOrder(order)}>View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedOrder && (
        <OrderModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
}

function OrderModal({ order, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>Order Details</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <p><strong>Order ID:</strong> {order.id}</p>
          <p><strong>Status:</strong> {order.status}</p>
          <p><strong>Payment:</strong> {order.customerInfo?.payment}</p>
          <p><strong>Total:</strong> {formatCurrency(order.total)}</p>

          <hr />

          <h4>Items</h4>
          <table className="items-table">
            <thead>
              <tr>
                <th>Thumbnail</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, i) => (
                <tr key={i}>
                  <td>
                    <img
                      src={item.image || item.img || "https://via.placeholder.com/50"}
                      alt={item.name}
                      width="50"
                    />
                  </td>
                  <td>{item.name}</td>
                  <td>{item.quantity || item.qty}</td>
                  <td>{formatCurrency(item.price)}</td>
                  <td>{formatCurrency(item.price * (item.quantity || item.qty))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="modal-footer">
          <button className="close-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
