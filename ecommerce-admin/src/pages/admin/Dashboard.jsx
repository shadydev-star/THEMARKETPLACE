import { useEffect, useState, useRef } from "react";
import { db } from "../../firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { useParams } from "react-router-dom";
import "../../styles/dashboard.css";

export default function Dashboard() {
  const { slug } = useParams();
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalStock, setTotalStock] = useState(0);
  const sliderRef = useRef(null);
  const isHovered = useRef(false);

  // 🔹 Fetch products in real-time
  useEffect(() => {
    const q = query(
      collection(db, "wholesalers", slug, "products"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setProducts(fetched);

      // ✅ Count only base products
      const productCount = fetched.length;

      // ✅ Total stock (including variants)
      let totalStockCount = 0;
      fetched.forEach((product) => {
        if (product.variants && product.variants.length > 0) {
          product.variants.forEach((v) => {
            totalStockCount += Number(v.stock) || 0;
          });
        } else {
          totalStockCount += Number(product.stock) || 0;
        }
      });

      setTotalProducts(productCount);
      setTotalStock(totalStockCount);
    });

    return () => unsub();
  }, [slug]);

  // ✅ Always use base product image
  const getProductImage = (product) =>
    product.image || product.imageUrl || product.photo || "/placeholder.png";

  const recentProducts = products.slice(0, 5);
  const displayProducts = [...recentProducts, ...recentProducts]; // for infinite scroll loop

  // 🎞️ Infinite auto-scroll (desktop only)
    // 🎞️ Infinite auto-scroll (desktop only)
  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider || displayProducts.length === 0) return;

    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return; // ❌ Disable auto-scroll on mobile/touch devices

    let scrollAmount = 0;
    const speed = 1.2; // scroll speed (px per tick)

    const scroll = () => {
      if (!slider) return;
      if (isHovered.current) return;

      slider.scrollLeft += speed;
      scrollAmount += speed;

      // ✅ When we’ve scrolled past the halfway point (first clone set), reset smoothly
      if (scrollAmount >= slider.scrollWidth / 2) {
        slider.scrollLeft = 0;
        scrollAmount = 0;
      }

      requestAnimationFrame(scroll);
    };

    const anim = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(anim);
  }, [displayProducts]);

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
      </div>

      {/* 🔹 Recent Products Section */}
      <div className="recent-products-section">
        <h3 className="section-title">Recent Products</h3>
        <div
          className={`slider-container ${isHovered.current ? "paused" : ""}`}
          ref={sliderRef}
          onMouseEnter={() => (isHovered.current = true)}
          onMouseLeave={() => (isHovered.current = false)}
        >

          <div className="image-slider">
            {displayProducts.length > 0 ? (
              displayProducts.map((product, i) => (
                <ProductSlide
                  key={`${product.id}-${i}`}
                  product={product}
                  getProductImage={getProductImage}
                />
              ))
            ) : (
              <p>No products yet...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 🧩 Subcomponent
function ProductSlide({ product, getProductImage }) {
  const [imgSrc, setImgSrc] = useState(getProductImage(product));

  return (
    <div className="slide">
      <img
        src={imgSrc}
        alt={product.name}
        loading="lazy"
        onError={() => setImgSrc("/placeholder.png")}
        className="fade-in"
      />
      <p>{product.name}</p>
    </div>
  );
}
