// src/pages/customer/OrderHistory.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/orderhistory.css";
import { db } from "../../firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { useCustomerAuth } from "../auth/CustomerAuthContext";
import formatCurrency from "../../utils/formatCurrency";

export default function OrderHistory() {
  const { customer } = useCustomerAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("active");

  useEffect(() => {
    if (!customer) return;

    // Get ALL orders across all stores for this customer
    const ordersRef = collection(db, "customers", customer.uid, "orders");
    const q = query(ordersRef, orderBy("createdAt", "desc"));

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

    return () => unsubscribe();
  }, [customer]);

  // Separate orders into active and past
  const activeOrders = orders.filter(order => 
    ['pending', 'processing', 'confirmed', 'shipped'].includes(order.status?.toLowerCase())
  );

  const pastOrders = orders.filter(order => 
    ['delivered', 'completed', 'cancelled'].includes(order.status?.toLowerCase())
  );

  const displayedOrders = activeSection === "active" ? activeOrders : pastOrders;

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
      case 'completed': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'shipped': return '#3b82f6';
      case 'cancelled': return '#ef4444';
      case 'processing': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'processing': return 'Processing';
      case 'shipped': return 'Shipped';
      case 'completed': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return status || 'Pending';
    }
  };

  if (loading) {
    return (
      <div className="order-history-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your order history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="order-history-page">
      {/* Header Section */}
      <div className="orders-header">
        <div className="breadcrumb-nav">
          
          <span className="breadcrumb-current">Order History</span>
        </div>
        
        <div className="orders-title-section">
          <h1 className="orders-main-title">Order History</h1>
          <div className="orders-stats">
            <div className="order-stat-item">
              <span className="order-stat-number">{activeOrders.length}</span>
              <span className="stat-label">Active Orders</span>
            </div>
            <div className="order-stat-item">
              <span className="order-stat-number">{pastOrders.length}</span>
              <span className="stat-label">Past Orders</span>
            </div>
            <div className="order-stat-item">
              <span className="order-stat-number">{orders.length}</span>
              <span className="stat-label">Total Orders</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="orders-section-tabs">
        <button 
          className={`section-tab ${activeSection === 'active' ? 'active' : ''}`}
          onClick={() => setActiveSection('active')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Active Orders ({activeOrders.length})
        </button>
        <button 
          className={`section-tab ${activeSection === 'past' ? 'active' : ''}`}
          onClick={() => setActiveSection('past')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Past Orders ({pastOrders.length})
        </button>
      </div>

      {/* Orders Grid */}
      <div className="orders-container">
        {displayedOrders.length === 0 ? (
          <div className="empty-section-state">
            <div className="empty-section-icon">
              {activeSection === 'active' ? (
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                  <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" 
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <h2>
              {activeSection === 'active' ? 'No Active Orders' : 'No Past Orders'}
            </h2>
            <p>
              {activeSection === 'active' 
                ? "You don't have any orders in progress at the moment."
                : "You haven't completed any orders yet."
              }
            </p>
            {activeSection === 'active' && (
              <Link to="/stores" className="continue-shopping-btn">
                Browse Stores
              </Link>
            )}
          </div>
        ) : (
          <div className="orders-grid">
            {displayedOrders.map((order) => (
              <OrderCard 
                key={order.id} 
                order={order} 
                isActive={activeSection === 'active'}
                getStatusColor={getStatusColor}
                getStatusText={getStatusText}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OrderCard({ order, isActive, getStatusColor, getStatusText }) {
  const orderDate = order.createdAt?.seconds 
    ? new Date(order.createdAt.seconds * 1000)
    : new Date(order.createdAt);

  return (
    <div className="order-card">
      <div className="order-card-header">
        <div className="order-meta">
          <h3 className="order-number">Order #{order.id.slice(-8).toUpperCase()}</h3>
          <div className="order-store">From: {order.storeSlug}</div>
          <span className="order-date">
            {orderDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </span>
        </div>
        <div 
          className="order-status-badge"
          style={{ 
            backgroundColor: getStatusColor(order.status) + '20',
            color: getStatusColor(order.status)
          }}
        >
          {getStatusText(order.status)}
        </div>
      </div>

      <div className="order-items-preview">
        {order.items?.slice(0, 2).map((item, index) => (
          <div key={index} className="preview-item">
            <img
              src={item.image || item.img || "https://via.placeholder.com/48?text=No+Image"}
              alt={item.name}
              className="preview-image"
            />
            <div className="preview-info">
              <span className="preview-name">{item.name}</span>
              <span className="preview-price">{formatCurrency(item.price)}</span>
            </div>
            <span className="preview-quantity">x{item.quantity || 1}</span>
          </div>
        ))}
        {order.items?.length > 2 && (
          <div className="more-items-indicator">
            +{order.items.length - 2} more items
          </div>
        )}
      </div>

      {/* Progress tracking for active orders */}
      {isActive && order.status?.toLowerCase() !== 'cancelled' && (
        <div className="order-progress-mini">
          <div className="progress-bar-mini">
            <div 
              className="progress-fill-mini" 
              style={{ 
                width: `${getProgressPercentage(order.status)}%`,
                backgroundColor: getStatusColor(order.status)
              }}
            ></div>
          </div>
          <div className="progress-steps-mini">
            <div className={`progress-step-mini ${getProgressStepStatus(order.status, 'ordered')}`}>
              <div className="step-dot"></div>
              <span>Ordered</span>
            </div>
            <div className={`progress-step-mini ${getProgressStepStatus(order.status, 'shipped')}`}>
              <div className="step-dot"></div>
              <span>Shipped</span>
            </div>
            <div className={`progress-step-mini ${getProgressStepStatus(order.status, 'delivered')}`}>
              <div className="step-dot"></div>
              <span>Delivered</span>
            </div>
          </div>
        </div>
      )}

      {/* Delivery date for past orders */}
      {!isActive && order.status?.toLowerCase() === 'delivered' && (
        <div className="delivery-info">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
              stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Delivered on {orderDate.toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
          })}</span>
        </div>
      )}

      <div className="order-card-footer">
        <div className="order-total">
          <span className="total-amount">{formatCurrency(order.total)}</span>
        </div>
        <div className="order-actions">
          <Link
            to={`/store/${order.storeSlug}/orders/${order.id}`}
            className="view-details-btn"
          >
            View Details
          </Link>
          {!isActive && order.status?.toLowerCase() === 'delivered' && (
            <Link
              to={`/store/${order.storeSlug}`}
              className="reorder-btn"
            >
              Reorder
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getProgressPercentage(status) {
  switch (status?.toLowerCase()) {
    case 'pending': return 25;
    case 'processing':
    case 'confirmed': return 50;
    case 'shipped': return 75;
    case 'completed':
    case 'delivered': return 100;
    default: return 25;
  }
}

function getProgressStepStatus(currentStatus, step) {
  const status = currentStatus?.toLowerCase();
  if (step === 'ordered') return 'completed';
  if (step === 'shipped') return ['shipped', 'completed', 'delivered'].includes(status) ? 'completed' : 'pending';
  if (step === 'delivered') return ['completed', 'delivered'].includes(status) ? 'completed' : 'pending';
  return 'pending';
}