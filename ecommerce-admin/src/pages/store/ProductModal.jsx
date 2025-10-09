import { useState, useMemo, useEffect } from "react";
import "../../styles/productModal.css";
import formatCurrency from "../../utils/formatCurrency";

export default function ProductModal({ product, onClose, addToCart, slug }) {
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [fadeKey, setFadeKey] = useState(0);
  const [showAdded, setShowAdded] = useState(false); // ✅ new: controls the animation

  const variants = product.variants || [];

  const uniqueColors = useMemo(() => {
    const seen = new Set();
    return variants.filter((v) => {
      if (!v.color) return false;
      const lower = v.color.toLowerCase();
      if (seen.has(lower)) return false;
      seen.add(lower);
      return true;
    });
  }, [variants]);

  const availableSizes = useMemo(() => {
    if (!selectedColor) return [];
    return variants.filter(
      (v) => v.color?.toLowerCase() === selectedColor.toLowerCase()
    );
  }, [selectedColor, variants]);

  const selectedVariant =
    variants.find(
      (v) =>
        v.color?.toLowerCase() === selectedColor?.toLowerCase() &&
        v.size === selectedSize
    ) || null;

  const baseImages =
    product.images && product.images.length > 0
      ? product.images
      : product.image
      ? [product.image]
      : product.imageUrl
      ? [product.imageUrl]
      : product.photo
      ? [product.photo]
      : product.img
      ? [product.img]
      : [];

  let media = [];

  if (selectedColor) {
    const firstColorVariant = variants.find(
      (v) => v.color?.toLowerCase() === selectedColor.toLowerCase()
    );
    media =
      (firstColorVariant?.images || []).map((url) => ({
        type: url.match(/\.(mp4|mov|webm)$/i) ? "video" : "image",
        url,
      })) || [];
  }

  if (media.length === 0 && baseImages.length > 0) {
    media = baseImages.map((url) => ({ type: "image", url }));
  }

  if (media.length === 0) {
    media = [{ type: "image", url: "/placeholder.png" }];
  }

  const selectedMedia = media[selectedMediaIndex] || media[0];

  useEffect(() => {
    setFadeKey((prev) => prev + 1);
  }, [selectedColor, selectedMediaIndex]);

  const handleAddToCart = () => {
    const productToAdd = selectedVariant
      ? {
          ...product,
          variant: selectedVariant,
          price: selectedVariant.price || product.price,
          id: `${product.id}-${selectedVariant.color}-${selectedVariant.size}`,
          name: `${product.name} (${selectedVariant.color}${
            selectedVariant.size ? " / " + selectedVariant.size : ""
          })`,
        }
      : { ...product, id: product.id };

    addToCart(slug, productToAdd);

    // ✅ show "Added to Cart" animation
    setShowAdded(true);
    setTimeout(() => setShowAdded(false), 2000);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-panel">
        <div className="modal-header">
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-scroll">
          {/* 🖼️ Media Section */}
          <div className="modal-media-wrapper">
            <div key={fadeKey} className="modal-media fade-in">
              {selectedMedia.type === "image" ? (
                <img src={selectedMedia.url} alt={product.name} />
              ) : (
                <video src={selectedMedia.url} controls />
              )}
            </div>

            <div className="thumbs">
              {media.map((m, i) => (
                <div
                  key={i}
                  className={`thumb ${i === selectedMediaIndex ? "active" : ""}`}
                  onClick={() => setSelectedMediaIndex(i)}
                >
                  {m.type === "image" ? (
                    <img src={m.url} alt={`thumb-${i}`} />
                  ) : (
                    <video src={m.url} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 📋 Details Section */}
          <div className="modal-details">
            <h2>{product.name}</h2>
            <p className="price">
              {formatCurrency(
                selectedVariant?.price ||
                  product.price ||
                  (availableSizes[0]?.price ?? 0)
              )}
            </p>
            <p className="desc">{product.description}</p>

            {variants.length > 0 && (
              <div className="variant-section">
                {/* 🎨 Color Selection */}
                <div className="variant-group">
                  <span>Color:</span>
                  <div className="swatch-row">
                    {uniqueColors.map((v, i) => (
                      <button
                        key={i}
                        className={`swatch-btn ${
                          selectedColor?.toLowerCase() ===
                          v.color?.toLowerCase()
                            ? "active"
                            : ""
                        }`}
                        onClick={() => {
                          setSelectedColor(v.color);
                          setSelectedSize(null);
                          setSelectedMediaIndex(0);
                        }}
                      >
                        {v.color}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 📏 Size Selection */}
                {selectedColor && availableSizes.length > 0 && (
                  <div className="variant-group">
                    <span>Size:</span>
                    <div className="swatch-row">
                      {availableSizes.map((v, i) => (
                        <button
                          key={i}
                          className={`swatch-btn ${
                            selectedSize === v.size ? "active" : ""
                          }`}
                          onClick={() => setSelectedSize(v.size)}
                        >
                          {v.size || "—"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 🛒 Add to Cart */}
            <button
              className="add-btn"
              disabled={
                (variants.length > 0 && !selectedVariant) ||
                selectedVariant?.stock === 0
              }
              onClick={handleAddToCart}
            >
              {!selectedVariant && variants.length > 0
                ? "Select Options"
                : selectedVariant?.stock === 0
                ? "Out of Stock"
                : "Add to Cart"}
            </button>

            {/* ✅ Added to Cart Animation */}
            {showAdded && (
              <div className="added-toast fade-in">
                ✅ Added to Cart!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
