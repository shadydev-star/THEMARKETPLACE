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
  }, [slug, customer]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
      case 'completed':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'shipped':
        return '#3b82f6';
      case 'cancelled':
        return '#ef4444';
      case 'processing':
        return '#8b5cf6';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'processing':
        return 'Processing';
      case 'shipped':
        return 'Shipped';
      case 'completed':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status || 'Pending';
    }
  };

  if (loading)
    return (
      <div className="modern-orders-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your orders...</p>
        </div>
      </div>
    );

  if (orders.length === 0)
    return (
      <div className="modern-orders-page">
        <div className="empty-orders-state">
          <div className="empty-orders-icon">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
              <path d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5.5M7 13l-2.5 5.5m0 0L6 21h12m0 0a2 2 0 100-4 2 2 0 000 4zm-8-8a2 2 0 100-4 2 2 0 000 4z" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2>No Orders Yet</h2>
          <p>You haven't placed any orders from this store yet.</p>
          <div className="action-buttons">
            <Link to={`/store/${slug}`} className="continue-shopping-btn">
              Start Shopping
            </Link>
            <Link to={`/customer/order-history`} className="view-history-btn">
              View All Orders
            </Link>
          </div>
        </div>
      </div>
    );

  return (
    <div className="modern-orders-page">
      {/* Header Section */}
      <div className="orders-header">
        <div className="breadcrumb-nav">
          
          <Link to={`/store/${slug}`} className="breadcrumb-link">{slug}</Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">My Orders</span>
        </div>
        
        <div className="orders-title-section">
          <h1 className="orders-main-title">My Orders - {slug}</h1>
          <div className="header-actions">
            <Link to={`/customer/order-history`} className="view-history-btn">
              View Full Order History
            </Link>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="orders-container">
        <div className="orders-grid">
          {orders.map((order) => (
            <OrderCard 
              key={order.id} 
              order={order} 
              slug={slug}
              getStatusColor={getStatusColor}
              getStatusText={getStatusText}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function OrderCard({ order, slug, getStatusColor, getStatusText }) {
  const orderDate = order.createdAt?.seconds 
    ? new Date(order.createdAt.seconds * 1000)
    : new Date(order.createdAt);

  const isActive = ['pending', 'processing', 'confirmed', 'shipped'].includes(order.status?.toLowerCase());

  return (
    <div className="order-card">
      <div className="order-card-header">
        <div className="order-meta">
          <h3 className="order-number">Order #{order.id.slice(-8).toUpperCase()}</h3>
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

      <div className="order-card-footer">
        <div className="order-total">
          <span className="total-amount">{formatCurrency(order.total)}</span>
        </div>
        <div className="order-actions">
          <Link
            to={`/store/${slug}/orders/${order.id}`}
            className="view-details-btn"
          >
            View Details
          </Link>
          {!isActive && order.status?.toLowerCase() === 'delivered' && (
            <button className="reorder-btn">
              Reorder
            </button>
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