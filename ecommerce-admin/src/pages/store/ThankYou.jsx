// src/pages/store/ThankYou.jsx
import { Link, useParams, useLocation } from "react-router-dom";
import "../../styles/thankyou.css";
import formatCurrency from "../../utils/formatCurrency";

export default function ThankYou() {
  const { slug } = useParams();
  const location = useLocation();

  // If you passed order info via navigate(..., { state: {...} })
  const order = location.state?.order;

  return (
    <div className="thankyou-page">
      {/* Header Section */}
      <div className="thankyou-header">
        <div className="thankyou-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 className="thankyou-title">Thank You for Your Order!</h1>
        <p className="thankyou-subtitle">
          Your order has been successfully placed and is being processed.
        </p>
        {order && (
          <p className="thankyou-order-id">
            Order #: {order.id.slice(-8).toUpperCase()}
          </p>
        )}
      </div>

      {/* Order Summary */}
      {order && (
        <div className="order-summary-card">
          <h3>Order Summary</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">Order Total</span>
              <span className="summary-value">{formatCurrency(order.total)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Items</span>
              <span className="summary-value">{order.items.length}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Payment Method</span>
              <span className="summary-value capitalize">{order.payment}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Status</span>
              <span className="summary-value" style={{ color: '#10b981' }}>
                Confirmed
              </span>
            </div>
          </div>
          <div className="summary-divider"></div>
          <div className="summary-total">
            <span>Total Amount</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        </div>
      )}

      {/* Next Steps */}
      <div className="next-steps">
        <h4>What's Next?</h4>
        <div className="steps-list">
          <div className="step-item">
            <div className="step-icon">1</div>
            <div className="step-content">
              <h5 className="step-title">Order Confirmation</h5>
              <p className="step-description">
                You'll receive an email confirmation with your order details within a few minutes.
              </p>
            </div>
          </div>
          <div className="step-item">
            <div className="step-icon">2</div>
            <div className="step-content">
              <h5 className="step-title">Order Processing</h5>
              <p className="step-description">
                We're preparing your items for shipment. This usually takes 1-2 business days.
              </p>
            </div>
          </div>
          <div className="step-item">
            <div className="step-icon">3</div>
            <div className="step-content">
              <h5 className="step-title">Shipping & Delivery</h5>
              <p className="step-description">
                You'll receive tracking information once your order ships. Delivery takes 2-5 business days.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <Link to={`/store/${slug}`} className="primary-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M3 10h11a8 8 0 018 8v0M3 10l6 6M3 10l6-6" 
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Continue Shopping
        </Link>
        <Link to={`/store/${slug}/orders`} className="secondary-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" 
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          View Orders
        </Link>
      </div>

      {/* Support Information */}
      <div className="support-info">
        <p>Need help with your order?</p>
        <div className="support-contact">
          <div className="contact-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" 
                stroke="currentColor" strokeWidth="2"/>
              <polyline points="22,6 12,13 2,6" 
                stroke="currentColor" strokeWidth="2"/>
            </svg>
            support@{slug}.com
          </div>
          <div className="contact-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" 
                stroke="currentColor" strokeWidth="2"/>
            </svg>
            +1 (555) 123-4567
          </div>
        </div>
      </div>
    </div>
  );
}