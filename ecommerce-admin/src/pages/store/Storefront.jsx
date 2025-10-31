import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import "../../styles/store.css";
import formatCurrency from "../../utils/formatCurrency";
import { useCart } from "../../context/CartContext";
import { useCustomerAuth } from "../auth/CustomerAuthContext";

export default function Storefront() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart, carts, showToast } = useCart();
  const { customer } = useCustomerAuth();
  const [search, setSearch] = useState("");
  const [store, setStore] = useState({ name: "", products: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home");

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

  // Generate random ratings for demo
  const getRandomRating = () => {
    return {
      stars: Math.floor(Math.random() * 3) + 3, // 3-5 stars
      reviews: Math.floor(Math.random() * 100) + 10 // 10-110 reviews
    };
  };

  if (loading) {
    return (
      <div className="mobile-storefront">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading store...</p>
        </div>
        {/* Mobile Bottom Nav */}
        <div className="mobile-bottom-nav">
          <button className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" strokeWidth="2"/>
              <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <span>Home</span>
          </button>
          <button className="nav-item">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <span>Search</span>
          </button>
          <button className="nav-item">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <span>Orders</span>
          </button>
          <button className="nav-item">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5.5M7 13l-2.5 5.5m0 0L6 21h12m0 0a2 2 0 100-4 2 2 0 000 4zm-8-8a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <span>Cart</span>
            {cartCount > 0 && <span className="nav-badge">{cartCount}</span>}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-storefront">
      {/* Header - Mobile Optimized */}
      <header className="mobile-header">
        <div className="header-top">
          <button className="menu-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
          <h1 className="store-title">{store.name}</h1>
          <Link to={`/store/${slug}/cart`} className="cart-icon-mobile">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5.5M7 13l-2.5 5.5m0 0L6 21h12m0 0a2 2 0 100-4 2 2 0 000 4zm-8-8a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" strokeWidth="2"/>
            </svg>
            {cartCount > 0 && <span className="cart-badge-mobile">{cartCount}</span>}
          </Link>
        </div>

        {/* Search Bar */}
        <div className="mobile-search-container">
          <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <input
            className="mobile-search"
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      {/* Hero Banner */}
      <section className="mobile-hero">
        <div className="hero-content">
          <h1 className="hero-title">Welcome to {store.name}</h1>
          <p className="hero-subtitle">Discover amazing products at great prices</p>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-number">{store.products.length}</span>
              <span className="stat-label">Products</span>
            </div>
            <div className="stat">
              <span className="stat-number">✓</span>
              <span className="stat-label">Free Shipping</span>
            </div>
            <div className="stat">
              <span className="stat-number">🛡️</span>
              <span className="stat-label">Secure Checkout</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="mobile-main">
        {/* Products Grid - 2 columns like in the video */}
        <div className="mobile-products-grid">
          {filtered.length > 0 ? (
            filtered.map((p) => {
              const rating = getRandomRating();
              return (
                <div key={p.id} className="mobile-product-card">
                  <div className="product-image-wrapper">
                    <img
                      src={p.image || p.img || "https://via.placeholder.com/300"}
                      alt={p.name}
                      className="mobile-product-image"
                      onClick={() => navigate(`/store/${slug}/product/${p.id}`)}
                    />
                    <button
                      className="quick-add-btn"
                      onClick={() => addToCart(slug, p)}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M12 6v6m0 0v6m0-6h6m-6 0H6" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </button>
                  </div>

                  <div className="mobile-product-info">
                    <h3 className="mobile-product-name">{p.name}</h3>
                    
                    {/* Ratings */}
                    <div className="mobile-product-rating">
                      <div className="stars">
                        {[...Array(5)].map((_, i) => (
                          <svg 
                            key={i} 
                            width="12" 
                            height="12" 
                            viewBox="0 0 24 24" 
                            fill={i < rating.stars ? "#ffc107" : "#e5e5e5"}
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                        ))}
                      </div>
                      <span className="rating-count">({rating.reviews})</span>
                    </div>

                    <div className="mobile-product-price">{formatCurrency(p.price)}</div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="mobile-empty-state">
              <div className="empty-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <h3>No products found</h3>
              <p>Try adjusting your search terms</p>
              <button 
                className="clear-search-btn"
                onClick={() => setSearch("")}
              >
                Clear Search
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="mobile-bottom-nav">
        <button 
          className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" strokeWidth="2"/>
            <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <span>Home</span>
        </button>

        <button 
          className={`nav-item ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <span>Search</span>
        </button>

        <Link 
          to={`/customer/order-history`}
          className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <span>Orders</span>
        </Link>

        <Link 
          to={`/store/${slug}/cart`}
          className={`nav-item ${activeTab === 'cart' ? 'active' : ''}`}
        >
          <div className="nav-cart-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5.5M7 13l-2.5 5.5m0 0L6 21h12m0 0a2 2 0 100-4 2 2 0 000 4zm-8-8a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" strokeWidth="2"/>
            </svg>
            {cartCount > 0 && <span className="nav-badge">{cartCount}</span>}
          </div>
          <span>Cart</span>
        </Link>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="mobile-toast">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2"/>
          </svg>
          Added to Cart
        </div>
      )}
    </div>
  );
}