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
import { useTheme } from "../../context/ThemeContext";

export default function Orders() {
  const { currentUser } = useAuth();
  const { isDarkMode } = useTheme();
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

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
      
      // Update selected order if it's the one being modified
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error("❌ Error updating status:", err);
      alert("Failed to update order status.");
    }
  };

  // 👁️ View Order Details
  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  // 🔍 Filter + search
  const filteredOrders = orders.filter((order) => {
    const matchSearch =
      order.id.toLowerCase().includes(search.toLowerCase()) ||
      order.customerInfo?.name?.toLowerCase().includes(search.toLowerCase()) ||
      order.customerInfo?.phone?.toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter ? order.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  // Get status badge class
  const getStatusClass = (status) => {
    switch (status) {
      case 'pending': return 'status-badge status-pending';
      case 'shipped': return 'status-badge status-shipped';
      case 'delivered': return 'status-badge status-delivered';
      default: return 'status-badge';
    }
  };

  // Calculate total items in order
  const getTotalItems = (order) => {
    if (order.items && Array.isArray(order.items)) {
      return order.items.reduce((total, item) => total + (item.quantity || 1), 0);
    }
    return 0;
  };

  if (loading) return (
    <div className={`loading-container ${isDarkMode ? 'dark-mode' : ''}`}>
      <div className="loading-spinner"></div>
      <p>Loading orders...</p>
    </div>
  );

  return (
    <div className={`admin-orders-page ${isDarkMode ? 'dark-mode' : ''}`}>
      {/* Header Section */}
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">Orders Management</h1>
          <p className="page-subtitle">Manage and track all customer orders</p>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <span className="stat-number">{orders.length}</span>
            <span className="stat-label">Total Orders</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">
              {orders.filter(o => o.status === 'pending').length}
            </span>
            <span className="stat-label">Pending</span>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="controls-section">
        <div className="search-container">
          <div className="search-input-wrapper">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search orders by ID, customer name, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`search-input ${isDarkMode ? 'dark-mode' : ''}`}
            />
          </div>
        </div>

        <div className="filters-container">
          <div className="filter-group">
            <label className="filter-label">Status Filter</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`filter-select ${isDarkMode ? 'dark-mode' : ''}`}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="quick-filters-section">
        <div className="quick-filters">
          <button
            className={`quick-filter-btn ${statusFilter === '' ? 'active' : ''} ${isDarkMode ? 'dark-mode' : ''}`}
            onClick={() => setStatusFilter('')}
          >
            All Orders
          </button>
          {["pending", "shipped", "delivered"].map((status) => (
            <button
              key={status}
              className={`quick-filter-btn status-${status} ${statusFilter === status ? 'active' : ''} ${isDarkMode ? 'dark-mode' : ''}`}
              onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
            >
              <span className={`status-indicator ${status}`}></span>
              {status.charAt(0).toUpperCase() + status.slice(1)}
              <span className="order-count">
                ({orders.filter(o => o.status === status).length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table - Desktop */}
      <div className="orders-table-container">
        <div className="table-header">
          <h3>Recent Orders</h3>
          <span className="results-count">{filteredOrders.length} orders found</span>
        </div>
        
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Status</th>
              <th>Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <tr key={order.id} className="order-row">
                  <td>
                    <div className="order-id">#{order.id}</div>
                    <div className="order-items-count">{getTotalItems(order)} items</div>
                  </td>
                  <td>
                    <div className="customer-info">
                      <div className="customer-name">{order.customerInfo?.name || "Unknown"}</div>
                      <div className="customer-phone">{order.customerInfo?.phone || "No phone"}</div>
                    </div>
                  </td>
                  <td>
                    <div className="order-date">
                      {order.createdAt?.toDate
                        ? order.createdAt.toDate().toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })
                        : "—"}
                    </div>
                    <div className="order-time">
                      {order.createdAt?.toDate
                        ? order.createdAt.toDate().toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : ""}
                    </div>
                  </td>
                  <td>
                    <div className={getStatusClass(order.status)}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </div>
                  </td>
                  <td>
                    <div className="order-total">
                      {formatCurrency(order.total)}
                    </div>
                  </td>
                  <td>
                    <div className="actions-container">
                      <button 
                        className={`view-btn ${isDarkMode ? 'dark-mode' : ''}`}
                        onClick={() => handleViewOrder(order)}
                        title="View Order Details"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/>
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </button>
                      <select
                        className={`status-dropdown ${isDarkMode ? 'dark-mode' : ''}`}
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-orders">
                  <div className="no-orders-content">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                      <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" 
                        stroke="currentColor" strokeWidth="2"/>
                      <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <h3>No orders found</h3>
                    <p>Try adjusting your search or filter criteria</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className={`order-details-modal ${isDarkMode ? 'dark-mode' : ''}`}>
          <div className="modal-overlay" onClick={() => setShowOrderDetails(false)}></div>
          <div className="modal-content">
            <div className="modal-header">
              <h2>Order #{selectedOrder.id}</h2>
              <button 
                className="close-btn"
                onClick={() => setShowOrderDetails(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="modal-body">
              {/* Order Header */}
              <div className="order-header">
                <div className="order-date-large">
                  {selectedOrder.createdAt?.toDate
                    ? selectedOrder.createdAt.toDate().toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      }) + ' at ' +
                      selectedOrder.createdAt.toDate().toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : "—"}
                </div>
                <div className={getStatusClass(selectedOrder.status)}>
                  {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                </div>
              </div>

              {/* Order Status Update */}
              <div className="status-update-section">
                <label className="section-label">Order Status</label>
                <select
                  className={`status-dropdown-large ${isDarkMode ? 'dark-mode' : ''}`}
                  value={selectedOrder.status}
                  onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>

              {/* Customer Information */}
              <div className="customer-section">
                <h3 className="section-title">Customer Information</h3>
                <div className="customer-details">
                  <div className="detail-row">
                    <span className="detail-label">Name</span>
                    <span className="detail-value">{selectedOrder.customerInfo?.name || "Unknown"}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Phone</span>
                    <span className="detail-value">{selectedOrder.customerInfo?.phone || "No phone"}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Address</span>
                    <span className="detail-value">{selectedOrder.customerInfo?.address || "No address"}</span>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="payment-section">
                <h3 className="section-title">Payment Information</h3>
                <div className="payment-details">
                  <div className="detail-row">
                    <span className="detail-label">Payment Method</span>
                    <span className="detail-value">{selectedOrder.payment || "Cash on Delivery"}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Payment Status</span>
                    <span className="detail-value payment-status-paid">
                      {selectedOrder.paymentReference ? "Paid" : "Pending"}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Total Amount</span>
                    <span className="detail-value total-amount-large">{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>

              {/* Order Items with Images */}
              <div className="order-items-section">
                <h3 className="section-title">
                  📌 Order Items ({getTotalItems(selectedOrder)})
                </h3>
                <div className="order-items-list">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item, index) => (
                      <div key={index} className="order-item">
                        <div className="item-left">
                          <div className="item-image">
                            <img 
                              src={item.image || item.img || "https://via.placeholder.com/60x60?text=No+Image"} 
                              alt={item.name}
                              onError={(e) => {
                                e.target.src = "https://via.placeholder.com/60x60?text=No+Image";
                              }}
                            />
                          </div>
                          <div className="item-info">
                            <div className="item-name">{item.name || `Item ${index + 1}`}</div>
                            <div className="item-price">{formatCurrency(item.price)} × {item.quantity || 1}</div>
                            {item.selectedColor && (
                              <div className="item-variant">Color: {item.selectedColor}</div>
                            )}
                            {item.selectedSize && (
                              <div className="item-variant">Size: {item.selectedSize}</div>
                            )}
                          </div>
                        </div>
                        <div className="item-total">
                          {formatCurrency((item.price || 0) * (item.quantity || 1))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-items">
                      No items found in this order
                    </div>
                  )}
                  <div className="order-total-section">
                    <div className="order-total-row">
                      <span className="total-label">Total</span>
                      <span className="total-amount">{formatCurrency(selectedOrder.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📱 Mobile Card View */}
      <div className="orders-cards">
        {filteredOrders.map((order) => (
          <div className={`order-card ${isDarkMode ? 'dark-mode' : ''}`} key={order.id}>
            <div className="card-header">
              <div>
                <div className="order-id-mobile">Order #{order.id}</div>
                <div className="order-items-count">{getTotalItems(order)} items</div>
              </div>
              <div className={getStatusClass(order.status)}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </div>
            </div>
            
            <div className="card-content">
              <div className="card-row">
                <span className="card-label">Customer</span>
                <span className="card-value">{order.customerInfo?.name || "Unknown"}</span>
              </div>
              <div className="card-row">
                <span className="card-label">Phone</span>
                <span className="card-value">{order.customerInfo?.phone || "No phone"}</span>
              </div>
              <div className="card-row">
                <span className="card-label">Date</span>
                <span className="card-value">
                  {order.createdAt?.toDate?.().toLocaleDateString()}
                </span>
              </div>
              <div className="card-row">
                <span className="card-label">Total</span>
                <span className="card-value total-amount">
                  {formatCurrency(order.total)}
                </span>
              </div>
            </div>

            <div className="card-actions">
              <button 
                className={`view-btn-mobile ${isDarkMode ? 'dark-mode' : ''}`}
                onClick={() => handleViewOrder(order)}
              >
                View Details
              </button>
              <select
                className={`status-dropdown-mobile ${isDarkMode ? 'dark-mode' : ''}`}
                value={order.status}
                onChange={(e) => handleStatusChange(order.id, e.target.value)}
              >
                <option value="pending">Mark as Pending</option>
                <option value="shipped">Mark as Shipped</option>
                <option value="delivered">Mark as Delivered</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}