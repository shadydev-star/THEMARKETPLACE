// src/pages/store/ProductDetails.jsx
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import "../../styles/productdetails.css";
import { useCart } from "../../context/CartContext";
import { useCustomerAuth } from "../auth/CustomerAuthContext";
import formatCurrency from "../../utils/formatCurrency";

export default function ProductDetails() {
  const { slug, productId } = useParams();
  const [product, setProduct] = useState(null);
  const [groupedVariants, setGroupedVariants] = useState({});
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [fadeKey, setFadeKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const { addToCart } = useCart();
  const { currentCustomer, loading: loadingAuth } = useCustomerAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Handle guest viewing (no redirect from shared product links)
  useEffect(() => {
    if (loadingAuth) return; // Wait for auth to load

    const isStorefront = location.pathname.startsWith("/store/");
    // Guests can view products freely on storefront
    if (isStorefront && !currentCustomer) return;

    // If user somehow hits a protected route outside storefront
    if (!isStorefront && !currentCustomer) {
      navigate("/customer/signup", { replace: true });
    }
  }, [currentCustomer, loadingAuth, location, navigate]);

  // 🧩 Fetch product and group variants by color
  useEffect(() => {
    async function fetchProduct() {
      try {
        const ref = doc(db, "wholesalers", slug, "products", productId);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() };
          setProduct(data);

          const grouped = {};
          data.variants?.forEach((v) => {
            if (!grouped[v.color]) grouped[v.color] = [];
            grouped[v.color].push(v);
          });

          setGroupedVariants(grouped);
          const firstColor = Object.keys(grouped)[0];
          if (firstColor) setSelectedColor(firstColor);
        } else {
          setProduct(null);
        }
      } catch (err) {
        console.error("Error fetching product:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [slug, productId]);

  // Reset media when color changes
  useEffect(() => {
    setFadeKey((prev) => prev + 1);
    setSelectedMediaIndex(0);
    const variants = groupedVariants[selectedColor] || [];
    if (variants.length > 0) setSelectedSize(variants[0].size);
  }, [selectedColor]);

  // Keyboard navigation for gallery
  useEffect(() => {
    const handleKey = (e) => {
      if (!isGalleryOpen) return;
      if (e.key === "Escape") setIsGalleryOpen(false);
      if (e.key === "ArrowRight") nextMedia();
      if (e.key === "ArrowLeft") prevMedia();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isGalleryOpen, selectedMediaIndex]);

  if (loading) return <div className="loading">Loading...</div>;
  if (!product) return <div className="not-found">Product not found</div>;

  const colorVariants = groupedVariants[selectedColor] || [];

  // Separate images and videos
  let images = [];
  let videos = [];
  if (selectedColor) {
    const colorVariant = groupedVariants[selectedColor];
    colorVariant?.forEach((v) => {
      (v.images || []).forEach((url) => {
        if (url.match(/\.(mp4|mov|webm|avi|m4v|mkv|ogg)(\?.*)?$/i)) {
          videos.push({ src: url });
        } else {
          images.push({ src: url });
        }
      });
    });
  }

  // Fallbacks
  if (images.length === 0 && videos.length === 0 && product.image)
    images.push({ src: product.image });
  if (images.length === 0 && videos.length === 0)
    images.push({ src: "/placeholder.png" });

  // Combine media
  const mediaItems = [
    ...images.map((i) => ({ type: "image", src: i.src })),
    ...videos.map((v) => ({ type: "video", src: v.src })),
  ];
  const selectedMedia = mediaItems[selectedMediaIndex];

  // Variant + price
  const selectedVariant =
    colorVariants.find((v) => v.size === selectedSize) ||
    colorVariants[0] ||
    {};
  const displayedPrice = selectedVariant.price || product.price || 0;

  const handleAddToCart = () => {
    addToCart(slug, {
      ...product,
      selectedColor,
      selectedSize,
      price: displayedPrice,
    });
  };

  const nextMedia = () => {
    setSelectedMediaIndex((prev) => (prev + 1) % mediaItems.length);
  };
  const prevMedia = () => {
    setSelectedMediaIndex(
      (prev) => (prev - 1 + mediaItems.length) % mediaItems.length
    );
  };

  // 🟢 SHARE BUTTON LOGIC
  const productUrl = `${window.location.origin}/store/${slug}/product/${productId}`;

  return (
    <div className="amazon-details-container">
      {/* LEFT: MEDIA SECTION */}
      <div className="media-section">
        <div
          key={fadeKey}
          className="main-media fade-in"
          onClick={() => setIsGalleryOpen(true)}
        >
          {selectedMedia?.type === "image" ? (
            <img src={selectedMedia.src} alt={product.name} className="main-image" />
          ) : (
            <video
              key={selectedMedia.src}
              src={selectedMedia.src}
              className="main-video"
              controls
              playsInline
            />
          )}

          {mediaItems.length > 1 && (
            <>
              <div
                className="media-arrow left"
                onClick={(e) => {
                  e.stopPropagation();
                  prevMedia();
                }}
              >
                ‹
              </div>
              <div
                className="media-arrow right"
                onClick={(e) => {
                  e.stopPropagation();
                  nextMedia();
                }}
              >
                ›
              </div>
            </>
          )}
        </div>
      </div>

      {/* CENTER: PRODUCT INFO */}
      <div className="info-section">
        <h2 className="product-title">{product.name}</h2>
        <p className="product-price">{formatCurrency(displayedPrice)}</p>
        <p className="product-description">{product.description}</p>

        {/* COLORS */}
        {Object.keys(groupedVariants).length > 0 && (
          <div className="variant-section">
            <h4>Color: {selectedColor}</h4>
            <div className="color-thumbnails">
              {Object.keys(groupedVariants).map((color, i) => {
                const firstImg = groupedVariants[color][0]?.images?.find(
                  (u) => !u.match(/\.(mp4|mov|webm|avi|m4v|mkv|ogg)(\?.*)?$/i)
                );
                return (
                  <img
                    key={i}
                    src={firstImg || "/placeholder.png"}
                    alt={color}
                    className={`color-thumb ${selectedColor === color ? "selected" : ""}`}
                    onClick={() => setSelectedColor(color)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* SIZES */}
        {colorVariants.length > 0 && (
          <div className="size-section">
            <h4>Size:</h4>
            <div className="size-boxes">
              {Array.from(new Set(colorVariants.map((v) => v.size))).map((size, i) => (
                <div
                  key={i}
                  className={`size-box ${selectedSize === size ? "selected" : ""}`}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: CART / BUY BOX */}
      <div className="cart-section">
        <div className="price-box">
          <p className="cart-price">{formatCurrency(displayedPrice)}</p>
          <p className="stock-info">In Stock</p>
        </div>

        <button className="add-to-cart" onClick={handleAddToCart}>
          Add to Cart
        </button>
        <button className="buy-now">Buy Now</button>

        {/* 🔗 SHARE BUTTONS */}
        <div className="share-buttons">
          <h4>Share:</h4>
          <div className="share-icons icon-only">
            {/* WhatsApp */}
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `${product.name} - ${productUrl}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="whatsapp"
              title="Share on WhatsApp"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" width="20" height="20">
                <path d="M20.52 3.48A11.86 11.86 0 0 0 12 0C5.37 0 .02 5.35.02 11.95c0 2.11.55 4.19 1.6 6.02L0 24l6.21-1.62A12 12 0 1 0 20.52 3.48Z" />
              </svg>
            </a>

            {/* Facebook */}
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                productUrl
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="facebook"
              title="Share on Facebook"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" width="20" height="20">
                <path d="M22.68 0H1.32A1.32 1.32 0 0 0 0 1.32v21.36A1.32 1.32 0 0 0 1.32 24h11.5v-9.28H9.75v-3.62h3.07V8.41c0-3.05 1.86-4.72 4.58-4.72 1.3 0 2.42.1 2.74.14v3.18l-1.88.001c-1.48 0-1.77.7-1.77 1.73v2.27h3.53l-.46 3.62h-3.07V24h6.02A1.32 1.32 0 0 0 24 22.68V1.32A1.32 1.32 0 0 0 22.68 0Z" />
              </svg>
            </a>

            {/* X / Twitter */}
            <a
              href={`https://x.com/intent/tweet?text=${encodeURIComponent(
                `${product.name} - ${productUrl}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="twitter"
              title="Share on X (Twitter)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" width="20" height="20">
                <path d="M22.162 0h-3.92l-5.69 7.03L7.08 0H0l8.72 11.3L0 24h3.92l6.08-7.52L16.92 24h7.08l-9.1-11.7L22.162 0Z" />
              </svg>
            </a>

            {/* Copy Link */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(productUrl);
                alert("✅ Product link copied!");
              }}
              className="copy-link"
              title="Copy Product Link"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" width="20" height="20">
                <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4v-2H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-2H7c-1.71 0-3.1-1.39-3.1-3.1ZM8 13h8v-2H8v2Zm9-6h-4v2h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4v2h4c2.76 0 5-2.24 5-5s-2.24-5-5-5Z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="delivery-info">
          <p>Ships from: <strong>{slug}</strong></p>
          <p>Sold by: <strong>{slug}</strong></p>
        </div>

        <div className="back-link">
          <Link to={`/store/${slug}`}>← Back to Store</Link>
        </div>
      </div>

      {/* FULLSCREEN GALLERY */}
      {isGalleryOpen && (
        <div className="gallery-overlay" onClick={() => setIsGalleryOpen(false)}>
          {selectedMedia?.type === "image" ? (
            <img src={selectedMedia.src} alt="Fullscreen" className="gallery-full-media" />
          ) : (
            <video
              src={selectedMedia.src}
              className="gallery-full-media"
              controls
              autoPlay
            />
          )}
          {mediaItems.length > 1 && (
            <>
              <div
                className="gallery-arrow left"
                onClick={(e) => {
                  e.stopPropagation();
                  prevMedia();
                }}
              >
                ‹
              </div>
              <div
                className="gallery-arrow right"
                onClick={(e) => {
                  e.stopPropagation();
                  nextMedia();
                }}
              >
                ›
              </div>
            </>
          )}
          <button className="gallery-close" onClick={() => setIsGalleryOpen(false)}>
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
