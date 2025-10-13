// src/pages/store/ThankYou.jsx
import { Link, useParams, useLocation } from "react-router-dom";
import "../../styles/store.css";
import formatCurrency from "../../utils/formatCurrency";

export default function ThankYou() {
  const { slug } = useParams();
  const location = useLocation();

  // If you passed order info via navigate(..., { state: {...} })
  const order = location.state?.order;

  return (
    <div className="thankyou-page">
      <h2>🎉 Thank You for Your Order!</h2>
      <p>Your order has been received and is being processed.</p>

      {order && (
        <div className="order-summary">
          <p><strong>Order Total:</strong> {formatCurrency(order.total)}</p>
          <p><strong>Items:</strong> {order.items.length}</p>
          <p><strong>Payment:</strong> {order.customerInfo.payment}</p>
        </div>
      )}

      <Link to={`/store/${slug}`} className="btn">
        Back to Store
      </Link>
    </div>
  );
}
