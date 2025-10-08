// src/pages/admin/Orders.jsx 
import { useState } from "react";
import "../../styles/orders.css";
import formatCurrency from "../../utils/formatCurrency"; // ✅ correct import

export default function Orders() {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // ✅ Dummy data (replace with Firestore later)
  const dummyOrders = [
    {
      id: "ORD123",
      customer: {
        name: "John Doe",
        email: "john@example.com",
        phone: "+234 801 234 5678",
        address: "123 Main St, Lagos",
      },
      date: "2025-10-01",
      status: "Pending",
      payment: "Card",
      total: 25000,
      items: [
        {
          name: "Hoodie",
          variant: "Blue L",
          qty: 2,
          price: 5000,
          img: "https://via.placeholder.com/50",
        },
        {
          name: "Shoes",
          variant: "Black 42",
          qty: 1,
          price: 15000,
          img: "https://via.placeholder.com/50",
        },
      ],
    },
    {
      id: "ORD124",
      customer: {
        name: "Jane Smith",
        email: "jane@example.com",
        phone: "+234 802 345 6789",
        address: "45 Broad St, Abuja",
      },
      date: "2025-10-02",
      status: "Shipped",
      payment: "Transfer",
      total: 10000,
      items: [
        {
          name: "Cap",
          variant: "Red",
          qty: 2,
          price: 5000,
          img: "https://via.placeholder.com/50",
        },
      ],
    },
  ];

  // ✅ Search & filter
  const filteredOrders = dummyOrders.filter((order) => {
    const matchSearch =
      order.id.toLowerCase().includes(search.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter ? order.status === statusFilter : true;

    return matchSearch && matchStatus;
  });

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
          <option value="Pending">Pending</option>
          <option value="Shipped">Shipped</option>
          <option value="Delivered">Delivered</option>
        </select>
      </div>

      {/* ✅ Orders Table */}
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
                <td>{order.customer.name}</td>
                <td>{order.date}</td>
                <td>
                  <span className={`status ${order.status.toLowerCase()}`}>
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
        />
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
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <p>
            <strong>Order ID:</strong> {order.id}
          </p>
          <p>
            <strong>Customer:</strong> {order.customer.name}
          </p>
          <p>
            <strong>Email:</strong> {order.customer.email}
          </p>
          <p>
            <strong>Phone:</strong> {order.customer.phone}
          </p>
          <p>
            <strong>Address:</strong> {order.customer.address}
          </p>

          <hr />

          <p>
            <strong>Status:</strong> {order.status}
          </p>
          <p>
            <strong>Date:</strong> {order.date}
          </p>
          <p>
            <strong>Payment:</strong> {order.payment}
          </p>
          <p>
            <strong>Total:</strong> {formatCurrency(order.total)}
          </p>

          <h4>Items</h4>
          <table className="items-table">
            <thead>
              <tr>
                <th>Thumbnail</th>
                <th>Product</th>
                <th>Variant</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, i) => (
                <tr key={i}>
                  <td>
                    <img src={item.img} alt={item.name} />
                  </td>
                  <td>{item.name}</td>
                  <td>{item.variant}</td>
                  <td>{item.qty}</td>
                  <td>{formatCurrency(item.price)}</td>
                  <td>{formatCurrency(item.price * item.qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="modal-footer">
          <button className="status-btn">Update Status</button>
          <button className="close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
