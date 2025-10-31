import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import "../../styles/orderdetails.css";
import { db } from "../../firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useCustomerAuth } from "../auth/CustomerAuthContext";
import formatCurrency from "../../utils/formatCurrency";

export default function OrderDetails() {
  const { slug, orderId } = useParams();
  const { customer } = useCustomerAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customer) return;

    const ref = doc(db, "customers", customer.uid, "orders", orderId);

    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setOrder({ id: snap.id, ...snap.data() });
        } else {
          console.warn("❌ Order not found.");
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error listening to order details:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [customer, orderId]);

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

  const getProgressPercentage = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 25;
      case 'processing': return 50;
      case 'shipped': return 75;
      case 'completed':
      case 'delivered': return 100;
      default: return 25;
    }
  };

  const getProgressSteps = (status) => {
    const steps = [
      { id: 'ordered', label: 'Order Placed', completed: true },
      { id: 'confirmed', label: 'Confirmed', completed: ['processing', 'shipped', 'completed', 'delivered'].includes(status?.toLowerCase()) },
      { id: 'shipped', label: 'Shipped', completed: ['shipped', 'completed', 'delivered'].includes(status?.toLowerCase()) },
      { id: 'delivered', label: 'Delivered', completed: ['completed', 'delivered'].includes(status?.toLowerCase()) }
    ];
    return steps;
  };

  if (loading)
    return (
      <div className="store-orders-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading order details...</p>
        </div>
      </div>
    );

  if (!order)
    return (
      <div className="store-orders-page">
        <div className="empty-orders-state">
          <h2>Order not found</h2>
          <p>The order you're looking for doesn't exist.</p>
          <Link to={`/store/${slug}/orders`} className="back-btn">
            ← Back to Orders
          </Link>
        </div>
      </div>
    );

  const orderDate = order.createdAt?.seconds 
    ? new Date(order.createdAt.seconds * 1000)
    : new Date(order.createdAt);
  
  const progressSteps = getProgressSteps(order.status);
  const progressPercentage = getProgressPercentage(order.status);

  return (
    <div className="store-orders-page">
      <div className="order-details-page">
        {/* Header Section */}
        <div className="order-details-header">
          <div className="breadcrumb-nav">
            
            <Link to={`/store/${slug}/orders`} className="breadcrumb-link">Orders</Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Order Details</span>
          </div>
          
          <div className="order-details-title-section">
            <div>
              <h1 className="order-details-main-title">
                Order #{order.id.slice(-8).toUpperCase()}
              </h1>
              <p className="order-subtitle">
                Placed on {orderDate.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Order Status Card */}
        <div className="order-status-card">
          <div className="status-header">
            <h3>Order Status</h3>
            <div 
              className="status-badge"
              style={{ 
                backgroundColor: getStatusColor(order.status) + '20',
                color: getStatusColor(order.status)
              }}
            >
              {order.status}
            </div>
          </div>

          {/* Progress Timeline */}
          <div className="order-progress-section">
            <div className="progress-header">
              <h3>Order Progress</h3>
              <span className="progress-percentage">{progressPercentage}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${progressPercentage}%`,
                  backgroundColor: getStatusColor(order.status)
                }}
              ></div>
            </div>
            <div className="progress-steps">
              {progressSteps.map((step, index) => (
                <div key={step.id} className="progress-step">
                  <div className={`step-icon ${step.completed ? 'completed' : ''}`}>
                    {step.completed ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  <span className="step-label">{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Information Grid */}
        <div className="order-info-grid">
          <div className="info-section">
            <h3>Order Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Order ID</span>
                <span className="info-value">#{order.id.slice(-8).toUpperCase()}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Order Date</span>
                <span className="info-value">
                  {orderDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Payment Method</span>
                <span className="info-value capitalize">{order.payment}</span>
              </div>
              {order.paymentReference && (
                <div className="info-item">
                  <span className="info-label">Payment Reference</span>
                  <span className="info-value">{order.paymentReference}</span>
                </div>
              )}
            </div>
          </div>

          <div className="info-section">
            <h3>Delivery Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Customer</span>
                <span className="info-value">{order.customerInfo?.name}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Phone</span>
                <span className="info-value">{order.customerInfo?.phone}</span>
              </div>
              <div className="info-item full-width">
                <span className="info-label">Address</span>
                <span className="info-value">{order.customerInfo?.address}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="order-items-section">
          <h3>Order Items ({order.items.length})</h3>
          <div className="items-table">
            {order.items.map((item, index) => (
              <div key={index} className="order-item-row">
                <div className="item-main">
                  <img
                    src={item.image || item.img || "https://via.placeholder.com/60?text=No+Image"}
                    alt={item.name}
                    className="item-image"
                  />
                  <div className="item-details">
                    <h4 className="item-name">{item.name}</h4>
                    <div className="item-variants">
                      {item.selectedColor && (
                        <span className="item-variant">Color: {item.selectedColor}</span>
                      )}
                      {item.selectedSize && (
                        <span className="item-variant">Size: {item.selectedSize}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="item-quantity">x{item.quantity || 1}</div>
                <div className="item-price">{formatCurrency(item.price)}</div>
                <div className="item-total">
                  {formatCurrency(item.price * (item.quantity || 1))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="order-summary-section">
          <h3>Order Summary</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal || order.total)}</span>
            </div>
            <div className="summary-item">
              <span>Shipping</span>
              <span className="free-shipping">Free</span>
            </div>
            {order.tax && (
              <div className="summary-item">
                <span>Tax</span>
                <span>{formatCurrency(order.tax)}</span>
              </div>
            )}
            <div className="summary-divider"></div>
            <div className="summary-total">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="order-actions">
          <Link to={`/store/${slug}/orders`} className="back-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Orders
          </Link>
          <button className="contact-support-btn">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}