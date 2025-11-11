// src/pages/admin/Dashboard.jsx
import { useEffect, useState, useRef } from "react";
import { db } from "../../firebase";
import { collection, onSnapshot, query, orderBy, where, getDocs } from "firebase/firestore";
import { useParams } from "react-router-dom";
import { FaCopy, FaCheck, FaBox, FaCube, FaPlus, FaShoppingCart } from "react-icons/fa";
import "../../styles/dashboard.css";
import formatCurrency from "../../utils/formatCurrency";
import { useTheme } from "../../context/ThemeContext";

export default function Dashboard() {
  const { isDarkMode } = useTheme();
  const { slug } = useParams();
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalStock, setTotalStock] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [copied, setCopied] = useState(false);
  const [wholesalerId, setWholesalerId] = useState(null);
  const sliderRef = useRef(null);
  const isHovered = useRef(false);

  // 🔹 Fetch wholesalerId by slug (for orders)
  useEffect(() => {
    const fetchWholesalerId = async () => {
      try {
        const q = query(collection(db, "wholesalers"), where("slug", "==", slug));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setWholesalerId(snapshot.docs[0].id);
        } else {
          console.warn("No wholesaler found for slug:", slug);
        }
      } catch (err) {
        console.error("Error fetching wholesaler ID:", err);
      }
    };
    fetchWholesalerId();
  }, [slug]);

  // 🔹 Fetch products in real-time (still by slug)
  useEffect(() => {
    const q = query(
      collection(db, "wholesalers", slug, "products"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setProducts(fetched);

      const productCount = fetched.length;

      let totalStockCount = 0;
      fetched.forEach((product) => {
        if (product.variants?.length) {
          product.variants.forEach((v) => (totalStockCount += Number(v.stock) || 0));
        } else {
          totalStockCount += Number(product.stock) || 0;
        }
      });

      setTotalProducts(productCount);
      setTotalStock(totalStockCount);
    });

    return () => unsub();
  }, [slug]);

  // 🔹 Fetch total orders in real-time (by wholesalerId)
  useEffect(() => {
    if (!wholesalerId) return;

    const q = query(collection(db, "wholesalers", wholesalerId, "orders"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snapshot) => {
      setTotalOrders(snapshot.size);
    });

    return () => unsub();
  }, [wholesalerId]);

  // ✅ Always use base product image
  const getProductImage = (product) => product.image || product.imageUrl || product.photo || "/placeholder.png";

  // 🔹 Recent Products Slider
  const recentProducts = products.slice(0, 5);
  const displayProducts = recentProducts.length > 1
    ? [...recentProducts, ...recentProducts] // duplicate only if more than 1
    : recentProducts;

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider || displayProducts.length <= 1) return; // no loop if 0 or 1 product

    let speed = 0.8; // scroll speed
    let rafId;

    const loopScroll = () => {
      if (isHovered.current) {
        rafId = requestAnimationFrame(loopScroll);
        return;
      }

      slider.scrollLeft += speed;

      // seamless reset
      if (slider.scrollLeft >= slider.scrollWidth / 2) {
        slider.scrollLeft -= slider.scrollWidth / 2;
      }

      rafId = requestAnimationFrame(loopScroll);
    };

    rafId = requestAnimationFrame(loopScroll);
    return () => cancelAnimationFrame(rafId);
  }, [displayProducts]);

  //  Copy storefront link
  const storefrontUrl = `${window.location.origin}/store/${slug}`;
  const copyLink = () => {
    navigator.clipboard.writeText(storefrontUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`dashboard ${isDarkMode ? 'dark-mode' : ''}`}>
      {/* 🔹 Header Section */}
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome back! Here's what's happening with your store today.</p>
      </div>

      {/* 🔹 Stats Section  */}
      <div className="stats-grid-new">
        <div className="stat-card-new">
          <div className="stat-icon stat-icon-products">
            <FaBox />
          </div>
          <div className="stat-content">
            <h3>{totalProducts}</h3>
            <p>Total Products</p>
          </div>
        </div>

        <div className="stat-card-new">
          <div className="stat-icon stat-icon-stock">
            <FaCube />
          </div>
          <div className="stat-content">
            <h3>{totalStock}</h3>
            <p>Total Stock</p>
          </div>
        </div>

        <div className="stat-card-new">
          <div className="stat-icon stat-icon-recent">
            <FaPlus />
          </div>
          <div className="stat-content">
            <h3>{recentProducts.length}</h3>
            <p>Recent Additions</p>
          </div>
        </div>

        <div className="stat-card-new">
          <div className="stat-icon stat-icon-orders">
            <FaShoppingCart />
          </div>
          <div className="stat-content">
            <h3>{totalOrders}</h3>
            <p>Total Orders</p>
          </div>
        </div>
      </div>

      {/* 🔹 Storefront Link Section */}
      <div className="storefront-section-new">
        <div className="section-header">
          <h2>Storefront Link</h2>
          <p>Share this link with your customers to start selling</p>
        </div>
        <div className="link-card-new">
          <div className="link-content">
            <span className="link-label">Your Store URL</span>
            <div className="link-box-new">
              <input 
                type="text" 
                value={storefrontUrl} 
                readOnly 
                className={isDarkMode ? 'dark-input' : ''}
              />
              <button 
                onClick={copyLink}
                className={`copy-btn-new ${copied ? 'copied' : ''} ${isDarkMode ? 'dark-btn' : ''}`}
              >
                {copied ? <FaCheck /> : <FaCopy />}
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 🔹 Recent Products Section*/}
      <div className="recent-products-section-new">
        <div className="section-header">
          <h2>Recent Products</h2>
          <p>Your latest product additions</p>
        </div>
        <div
          className={`slider-container-new ${isHovered.current ? "paused" : ""} ${isDarkMode ? 'dark-slider' : ''}`}
          ref={sliderRef}
          onMouseEnter={() => (isHovered.current = true)}
          onMouseLeave={() => (isHovered.current = false)}
        >
          <div className="image-slider-new">
            {displayProducts.length > 0
              ? displayProducts.map((product, i) => (
                  <ProductSlideNew 
                    key={`${product.id}-${i}`} 
                    product={product} 
                    getProductImage={getProductImage}
                    isDarkMode={isDarkMode}
                  />
                ))
              : (
                <div className="empty-state">
                  <div className="empty-icon">📦</div>
                  <p>No products yet</p>
                  <span>Add your first product to get started</span>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Product Slide 
function ProductSlideNew({ product, getProductImage, isDarkMode }) {
  const [imgSrc, setImgSrc] = useState(getProductImage(product));

  const productPrice = product.price || product.variants?.[0]?.price || 0;

  return (
    <div className={`slide-new ${isDarkMode ? 'dark-slide' : ''}`}>
      <div className="product-image-container">
        <img 
          src={imgSrc} 
          alt={product.name} 
          loading="lazy" 
          onError={() => setImgSrc("/placeholder.png")} 
          className="product-image"
        />
      </div>
      <div className="product-info">
        <h4 className={isDarkMode ? 'dark-text' : ''}>{product.name}</h4>
        <span className={`product-price ${isDarkMode ? 'dark-price' : ''}`}>
          {formatCurrency(productPrice)} 
        </span>
      </div>
    </div>
  );
}