// src/pages/admin/Dashboard.jsx
import { useEffect, useState, useRef } from "react";
import { db } from "../../firebase";
import { collection, onSnapshot, query, orderBy, where, getDocs } from "firebase/firestore";
import { useParams } from "react-router-dom";
import { FaCopy, FaCheck } from "react-icons/fa";
import "../../styles/dashboard.css";

export default function Dashboard() {
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


  // 🎞️ Infinite auto-scroll (seamless version)
useEffect(() => {
  const slider = sliderRef.current;
  if (!slider || displayProducts.length === 0) return;

  let speed = 0.8;
  let rafId;

  const loop = () => {
    if (isHovered.current) {
      rafId = requestAnimationFrame(loop);
      return;
    }

    slider.scrollLeft += speed;

    const halfWidth = slider.scrollWidth / 2;
    // if fully scrolled through first half
    if (slider.scrollLeft >= halfWidth) {
      // subtract halfWidth instead of resetting to 0 (no jump)
      slider.scrollLeft -= halfWidth;
    }

    rafId = requestAnimationFrame(loop);
  };

  rafId = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(rafId);
}, [displayProducts]);




  // 🧩 Copy storefront link
  const storefrontUrl = `${window.location.origin}/store/${slug}`;
  const copyLink = () => {
    navigator.clipboard.writeText(storefrontUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="dashboard">
      <h2>Admin Dashboard</h2>

      {/* 🔹 Stats Section */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Products</h3>
          <p>{totalProducts}</p>
        </div>

        <div className="stat-card">
          <h3>Total Stock</h3>
          <p>{totalStock}</p>
        </div>

        <div className="stat-card">
          <h3>Recent Additions</h3>
          <p>{recentProducts.length}</p>
        </div>

        <div className="stat-card">
          <h3>Total Orders</h3>
          <p>{totalOrders}</p>
        </div>
      </div>

      {/* 🔹 Storefront Link Section */}
      <div className="storefront-link-card">
        <h3>Your Storefront Link</h3>
        <div className="link-box">
          <input type="text" value={storefrontUrl} readOnly />
          <button onClick={copyLink}>
            {copied ? <FaCheck color="green" /> : <FaCopy />} {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {/* 🔹 Recent Products Slider */}
      <div className="recent-products-section">
        <h3 className="section-title">Recent Products</h3>
        <div
          className={`slider-container ${isHovered.current ? "paused" : ""}`}
          ref={sliderRef}
          onMouseEnter={() => (isHovered.current = true)}
          onMouseLeave={() => (isHovered.current = false)}
        >
          <div className="image-slider">
            {displayProducts.length > 0
              ? displayProducts.map((product, i) => (
                  <ProductSlide key={`${product.id}-${i}`} product={product} getProductImage={getProductImage} />
                ))
              : <p>No products yet...</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// 🧩 Product Slide
function ProductSlide({ product, getProductImage }) {
  const [imgSrc, setImgSrc] = useState(getProductImage(product));

  return (
    <div className="slide">
      <img src={imgSrc} alt={product.name} loading="lazy" onError={() => setImgSrc("/placeholder.png")} className="fade-in" />
      <p>{product.name}</p>
    </div>
  );
}
