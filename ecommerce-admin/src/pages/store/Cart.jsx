import { Link, useParams } from "react-router-dom";
import "../../styles/cart.css";
import formatCurrency from "../../utils/formatCurrency";
import { useCart } from "../../context/CartContext";

export default function Cart() {
  const { slug } = useParams();
  const { carts, removeFromCart, updateQuantity } = useCart();
  const cart = carts[slug] || [];

  // 🧮 Calculate subtotal
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * (item.quantity || 1),
    0
  );

  // Calculate item count for badge
  const itemCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <div className="modern-cart-page">
      {/* Header Section */}
      <div className="cart-header">
        <div className="breadcrumb-nav">
          <Link to={`/store/${slug}`} className="breadcrumb-link">{slug}</Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">Shopping Cart</span>
        </div>
        
        <div className="cart-title-section">
          <h1 className="cart-main-title">Shopping Cart</h1>
          <div className="cart-badge">{itemCount} {itemCount === 1 ? 'item' : 'items'}</div>
        </div>
      </div>

      {cart.length === 0 ? (
        <div className="empty-cart-state">
          <div className="empty-cart-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <path d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5.5M7 13l-2.5 5.5m0 0L6 21h12m0 0a2 2 0 100-4 2 2 0 000 4zm-8-8a2 2 0 100-4 2 2 0 000 4z" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2>Your cart is empty</h2>
          <p>Browse our products and add items to your cart</p>
          <Link to={`/store/${slug}`} className="continue-shopping-btn">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          {/* Order Summary Section - Moved to top on mobile */}
          <div className="order-summary-section">
            <div className="order-summary-card">
              <h3 className="summary-title">Order Summary</h3>

              {/* Promo Code Section - Mobile */}
              <div className="promo-code-section">
                <div className="promo-code-input">
                  <input 
                    type="text" 
                    placeholder="Enter promo code" 
                    className="promo-input"
                  />
                  <button className="apply-promo-btn">Apply</button>
                </div>
              </div>

              <div className="summary-line">
                <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>

              <div className="summary-line">
                <span>Shipping</span>
                <span className="free-shipping">Free</span>
              </div>

              <div className="summary-line">
                <span>Tax</span>
                <span>Calculated at checkout</span>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-total">
                <span>Total</span>
                <span className="total-amount">{formatCurrency(subtotal)}</span>
              </div>

              <Link to={`/store/${slug}/checkout`} className="checkout-btn-modern">
                Proceed to Checkout
              </Link>

              <div className="payment-methods">
                <p className="payment-methods-label">We accept:</p>
                <div className="payment-icons">
                  <div className="payment-icon">💳</div>
                  <div className="payment-icon">📱</div>
                  <div className="payment-icon">🏦</div>
                </div>
              </div>

              <div className="security-notice">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <span>Secure checkout guaranteed</span>
              </div>
            </div>
          </div>

          {/* Cart Items Section */}
          <div className="cart-items-section">
            <div className="cart-items-header">
              <h3>Cart Items</h3>
              <span className="items-count">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
            </div>

            <div className="cart-items-list">
              {cart.map((item) => (
                <div key={item.id} className="cart-item-card">
                  <div className="item-image-section">
                    <img
                      src={
                        item.image ||
                        item.img ||
                        "https://via.placeholder.com/120?text=No+Image"
                      }
                      alt={item.name}
                      className="cart-item-image"
                    />
                  </div>

                  <div className="item-details-section">
                    <div className="item-header">
                      <h4 className="item-name">{item.name}</h4>
                      <button
                        className="remove-item-btn"
                        onClick={() => removeFromCart(slug, item.id)}
                        title="Remove item"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>

                    <div className="item-price">{formatCurrency(item.price)}</div>

                    {item.selectedColor && (
                      <div className="item-variant">
                        <span className="variant-label">Color:</span>
                        <span className="variant-value">{item.selectedColor}</span>
                      </div>
                    )}

                    {item.selectedSize && (
                      <div className="item-variant">
                        <span className="variant-label">Size:</span>
                        <span className="variant-value">{item.selectedSize}</span>
                      </div>
                    )}

                    <div className="quantity-controls">
                      <div className="quantity-section">
                        <span className="quantity-label">Quantity:</span>
                        <div className="quantity-selector">
                          <button
                            className="quantity-btn decrease"
                            onClick={() =>
                              updateQuantity(slug, item.id, (item.quantity || 1) - 1)
                            }
                            disabled={item.quantity <= 1}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                          <span className="quantity-display">{item.quantity || 1}</span>
                          <button
                            className="quantity-btn increase"
                            onClick={() =>
                              updateQuantity(slug, item.id, (item.quantity || 1) + 1)
                            }
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Mobile Total Price */}
                    <div className="item-total-mobile">
                      <span className="total-label">Total:</span>
                      <span className="total-price">{formatCurrency(item.price * (item.quantity || 1))}</span>
                    </div>

                    {/* Mobile Action Buttons */}
                    <div className="item-actions-mobile">
                      <button className="save-for-later-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        Save for later
                      </button>
                      <button 
                        className="remove-btn-mobile"
                        onClick={() => removeFromCart(slug, item.id)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" 
                                stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="continue-shopping-section">
              <Link to={`/store/${slug}`} className="continue-shopping-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}