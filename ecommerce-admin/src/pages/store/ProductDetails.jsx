// src/pages/store/ProductDetails.jsx
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import "../../styles/productdetails.css";
import { useCart } from "../../context/CartContext";
import { useCustomerAuth } from "../auth/CustomerAuthContext";
import formatCurrency from "../../utils/formatCurrency";

// Toast Component
const Toast = ({ message, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // Auto-close after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="toast-notification">
      <div className="toast-content">
        <div className="toast-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="toast-message">{message}</div>
        <button className="toast-close" onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

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
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

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

  const showAddToCartToast = (productName, color, size) => {
    const message = `Added ${productName}${color ? ` (${color}` : ''}${size ? `, ${size}` : ''}${color ? ')' : ''} to cart`;
    setToastMessage(message);
    setShowToast(true);
  };

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
    
    // Show toast notification
    showAddToCartToast(product.name, selectedColor, selectedSize);
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
    <div className="modern-details-container">
      {/* Toast Notification */}
      <Toast 
        message={toastMessage} 
        isVisible={showToast} 
        onClose={() => setShowToast(false)} 
      />

      {/* BREADCRUMB NAVIGATION */}
      <nav className="breadcrumb-nav">
        <Link to={`/store/${slug}`} className="breadcrumb-link">{slug}</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{product.name}</span>
      </nav>

      <div className="product-details-grid">
        {/* LEFT: MEDIA GALLERY */}
        <div className="media-gallery">
          <div className="main-media-container">
            <div
              key={fadeKey}
              className="main-media-card"
              onClick={() => setIsGalleryOpen(true)}
            >
              {selectedMedia?.type === "image" ? (
                <img 
                  src={selectedMedia.src} 
                  alt={product.name} 
                  className="main-product-image" 
                />
              ) : (
                <video
                  key={selectedMedia.src}
                  src={selectedMedia.src}
                  className="main-product-video"
                  controls
                  playsInline
                />
              )}

              {mediaItems.length > 1 && (
                <>
                  <button
                    className="media-nav-btn prev-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      prevMedia();
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <button
                    className="media-nav-btn next-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      nextMedia();
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* THUMBNAIL STRIP */}
          {mediaItems.length > 1 && (
            <div className="thumbnail-strip">
              {mediaItems.map((media, index) => (
                <div
                  key={index}
                  className={`thumbnail-item ${selectedMediaIndex === index ? 'active' : ''}`}
                  onClick={() => setSelectedMediaIndex(index)}
                >
                  {media.type === "image" ? (
                    <img src={media.src} alt={`View ${index + 1}`} />
                  ) : (
                    <div className="video-thumbnail">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: PRODUCT INFO & ACTIONS */}
        <div className="product-info-sidebar">
          <div className="product-info-card">
            <h1 className="product-title-modern">{product.name}</h1>
            
            <div className="price-section">
              <span className="current-price">{formatCurrency(displayedPrice)}</span>
              {product.originalPrice && product.originalPrice > displayedPrice && (
                <span className="original-price">{formatCurrency(product.originalPrice)}</span>
              )}
            </div>

            <div className="rating-section">
              <div className="stars">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ))}
              </div>
              <span className="review-count">(42 reviews)</span>
            </div>

            <p className="product-description-modern">{product.description}</p>

            {/* COLOR SELECTION */}
            {Object.keys(groupedVariants).length > 0 && (
              <div className="variant-section-modern">
                <div className="variant-header">
                  <h3>Color</h3>
                  <span className="selected-color-name">{selectedColor}</span>
                </div>
                <div className="color-options">
                  {Object.keys(groupedVariants).map((color, i) => {
                    const firstImg = groupedVariants[color][0]?.images?.find(
                      (u) => !u.match(/\.(mp4|mov|webm|avi|m4v|mkv|ogg)(\?.*)?$/i)
                    );
                    return (
                      <button
                        key={i}
                        className={`color-option ${selectedColor === color ? 'selected' : ''}`}
                        onClick={() => setSelectedColor(color)}
                      >
                        <img
                          src={firstImg || "/placeholder.png"}
                          alt={color}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SIZE SELECTION */}
            {colorVariants.length > 0 && (
              <div className="variant-section-modern">
                <div className="variant-header">
                  <h3>Size</h3>
                  <a href="#size-guide" className="size-guide-link">Size Guide</a>
                </div>
                <div className="size-options">
                  {Array.from(new Set(colorVariants.map((v) => v.size))).map((size, i) => (
                    <button
                      key={i}
                      className={`size-option ${selectedSize === size ? 'selected' : ''}`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="action-buttons">
              <button className="add-to-cart-modern" onClick={handleAddToCart}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5.5M7 13l-2.5 5.5m0 0L6 21h12m0 0a2 2 0 100-4 2 2 0 000 4zm-8-8a2 2 0 100-4 2 2 0 000 4z" 
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Add to Cart
              </button>
              <button className="buy-now-modern">
                Buy Now
              </button>
            </div>

            {/* DELIVERY INFO */}
            <div className="delivery-card">
              <div className="delivery-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                </svg>
                <div>
                  <strong>Free shipping</strong>
                  <p>Delivery in 2-4 business days</p>
                </div>
              </div>
              <div className="delivery-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <div>
                  <strong>In stock</strong>
                  <p>Ready to ship</p>
                </div>
              </div>
            </div>

            {/* SHARE SECTION */}
            <div className="share-section-modern">
              <h4>Share this product</h4>
              <div className="share-buttons-modern">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `${product.name} - ${productUrl}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="share-btn whatsapp-btn"
                  title="Share on WhatsApp"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path d="M20.52 3.48A11.86 11.86 0 0 0 12 0C5.37 0 .02 5.35.02 11.95c0 2.11.55 4.19 1.6 6.02L0 24l6.21-1.62A12 12 0 1 0 20.52 3.48Z" fill="currentColor"/>
                  </svg>
                </a>

                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                    productUrl
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="share-btn facebook-btn"
                  title="Share on Facebook"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path d="M22.68 0H1.32A1.32 1.32 0 0 0 0 1.32v21.36A1.32 1.32 0 0 0 1.32 24h11.5v-9.28H9.75v-3.62h3.07V8.41c0-3.05 1.86-4.72 4.58-4.72 1.3 0 2.42.1 2.74.14v3.18l-1.88.001c-1.48 0-1.77.7-1.77 1.73v2.27h3.53l-.46 3.62h-3.07V24h6.02A1.32 1.32 0 0 0 24 22.68V1.32A1.32 1.32 0 0 0 22.68 0Z" fill="currentColor"/>
                  </svg>
                </a>

                <a
                  href={`https://x.com/intent/tweet?text=${encodeURIComponent(
                    `${product.name} - ${productUrl}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="share-btn twitter-btn"
                  title="Share on X (Twitter)"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path d="M22.162 0h-3.92l-5.69 7.03L7.08 0H0l8.72 11.3L0 24h3.92l6.08-7.52L16.92 24h7.08l-9.1-11.7L22.162 0Z" fill="currentColor"/>
                  </svg>
                </a>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(productUrl);
                    setToastMessage("✅ Product link copied to clipboard!");
                    setShowToast(true);
                  }}
                  className="share-btn copy-btn"
                  title="Copy Product Link"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4v-2H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-2H7c-1.71 0-3.1-1.39-3.1-3.1ZM8 13h8v-2H8v2Zm9-6h-4v2h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4v2h4c2.76 0 5-2.24 5-5s-2.24-5-5-5Z" fill="currentColor"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FULLSCREEN GALLERY MODAL */}
      {isGalleryOpen && (
        <div className="gallery-modal-overlay" onClick={() => setIsGalleryOpen(false)}>
          <div className="gallery-modal-content" onClick={(e) => e.stopPropagation()}>
            {selectedMedia?.type === "image" ? (
              <img src={selectedMedia.src} alt="Fullscreen" className="gallery-modal-image" />
            ) : (
              <video
                src={selectedMedia.src}
                className="gallery-modal-video"
                controls
                autoPlay
              />
            )}
            
            {mediaItems.length > 1 && (
              <>
                <button
                  className="modal-nav-btn modal-prev-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    prevMedia();
                  }}
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button
                  className="modal-nav-btn modal-next-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    nextMedia();
                  }}
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </>
            )}
            
            <button 
              className="modal-close-btn"
              onClick={() => setIsGalleryOpen(false)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            
            <div className="gallery-modal-thumbnails">
              {mediaItems.map((media, index) => (
                <div
                  key={index}
                  className={`modal-thumbnail ${selectedMediaIndex === index ? 'active' : ''}`}
                  onClick={() => setSelectedMediaIndex(index)}
                >
                  {media.type === "image" ? (
                    <img src={media.src} alt={`Thumbnail ${index + 1}`} />
                  ) : (
                    <div className="modal-video-thumb">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}