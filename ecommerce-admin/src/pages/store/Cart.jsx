import { Link, useParams } from "react-router-dom";
import "../../styles/store.css";
import formatCurrency from "../../utils/formatCurrency";
import { useCart } from "../../context/CartContext"; // ✅ import context

export default function Cart() {
  const { slug } = useParams();
  const { carts, removeFromCart, updateQuantity } = useCart();
  const cart = carts[slug] || [];

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * (item.quantity || 1),
    0
  );

  return (
    <div className="cart-page">
      <h2>Your Cart</h2>

      {cart.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <table className="cart-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <tr key={item.id}>
                  <td className="cart-item">
                    <img src={item.img} alt={item.name} />
                    {item.name}
                  </td>
                  <td>{formatCurrency(item.price)}</td>
                  <td>
                    <input
                      type="number"
                      value={item.quantity || 1}
                      min="1"
                      onChange={(e) =>
                        updateQuantity(slug, item.id, parseInt(e.target.value))
                      }
                    />
                  </td>
                  <td>{formatCurrency(item.price * (item.quantity || 1))}</td>
                  <td>
                    <button
                      className="btn remove-btn"
                      onClick={() => removeFromCart(slug, item.id)}
                    >
                      ✖
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="cart-summary">
            <h3>Subtotal: {formatCurrency(subtotal)}</h3>
            <Link to={`/store/${slug}/checkout`} className="btn checkout-btn">
              Proceed to Checkout
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
