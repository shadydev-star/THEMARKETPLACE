import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import "../../styles/store.css";
import formatCurrency from "../../utils/formatCurrency";
import { useCart } from "../../context/CartContext";

export default function Storefront() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart, carts, showToast } = useCart();
  const [search, setSearch] = useState("");
  const [store, setStore] = useState({ name: "", products: [] });
  const [loading, setLoading] = useState(true);


      useEffect(() => {
      if (slug) {
        localStorage.setItem("lastStoreSlug", slug);
      }
    }, [slug]);


  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        const infoRef = doc(db, "wholesalers", slug);
        const infoSnap = await getDoc(infoRef);

        const productsRef = collection(db, "wholesalers", slug, "products");
        const productsSnap = await getDocs(productsRef);
        const products = productsSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        if (infoSnap.exists()) {
          setStore({ name: infoSnap.data().name, products });
        } else {
          setStore({ name: slug.replace("-", " "), products });
        }
      } catch (err) {
        console.error("Error loading store:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStoreData();
  }, [slug]);

  const filtered = store.products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const cartCount = (carts[slug] || []).reduce(
    (count, item) => count + (item.quantity || 1),
    0
  );

  if (loading) {
    return (
      <div className="storefront loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="storefront">
      {/* Navbar */}
      <div className="store-navbar">
        <Link to={`/store/${slug}`} className="store-logo">
          {store.name}
        </Link>

        <input
          className="store-search"
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="nav-icons">
          <Link to={`/store/${slug}/orders`} className="store-orders">
            🧾 Orders
          </Link>

          <div className={`cart-icon-wrapper ${showToast ? "bounce" : ""}`}>
            <Link to={`/store/${slug}/cart`} className="store-cart">
              🛒 Cart ({cartCount})
            </Link>
            {showToast && <div className="cart-toast">✅ Added to Cart</div>}
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="store-hero">
        <h2>Welcome to {store.name}</h2>
        <p>Explore the latest products from {store.name}</p>
      </div>

      {/* Product Grid */}
      <div className="products-grid">
        {filtered.length > 0 ? (
          filtered.map((p) => (
            <div key={p.id} className="product-card">
              <div className="image-con">
                <img
                  src={p.image || p.img || "https://via.placeholder.com/200"}
                  alt={p.name}
                  className="product-img"
                  onClick={() =>
                    navigate(`/store/${slug}/product/${p.id}`)
                  }
                  style={{ cursor: "pointer" }}
                />
              </div>

              <div className="product-info">
                <h3 className="product-name">{p.name}</h3>
                <p className="product-price">{formatCurrency(p.price)}</p>
              </div>

              <div className="product-actions">
                <button
                    className="view-btn"
                    onClick={() =>
                      navigate(`/store/${slug}/product/${p.id}`, { state: { from: "wholesaler" } })
                    }
                  >
                  View
                </button>
                <button
                  className="btn add-btn"
                  onClick={() => addToCart(slug, p)}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="no-products">No products available</p>
        )}
      </div>

      {/* Footer */}
      <footer className="store-footer">
        <p>
          © {new Date().getFullYear()} {store.name}. Powered by OurApp
        </p>
        <div className="footer-links">
          <Link to="/">Home</Link>
          <Link to="/help">Help</Link>
          <Link to="/terms">Terms</Link>
        </div>
      </footer>
    </div>
  );
}
