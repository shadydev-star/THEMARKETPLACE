import { useState, useEffect } from "react";
import "../../styles/productModal.css";
import formatCurrency from "../../utils/formatCurrency";

export default function ProductModal({ product, onClose, addToCart }) {
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

  const variants = product.variants || [];
  const selectedVariant = variants[selectedVariantIndex] || null;

  // Fallback media
  const media =
    (selectedVariant?.images || []).map((url) => ({
      type: url.match(/\.(mp4|mov|webm)$/i) ? "video" : "image",
      url,
    })) ||
    (product.img ? [{ type: "image", url: product.img }] : []);

  const selectedMedia = media[selectedMediaIndex];

  const nextMedia = () =>
    setSelectedMediaIndex((prev) => (prev + 1) % media.length);
  const prevMedia = () =>
    setSelectedMediaIndex((prev) =>
      prev === 0 ? media.length - 1 : prev - 1
    );

  return (
    <div className="modal-overlay">
      <div className="modal-panel">
        <div className="modal-header">
          <h3>Please Select Variation</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-scroll">
          {/* Media Section */}
          <div className="modal-media">
            {selectedMedia ? (
              selectedMedia.type === "image" ? (
                <img src={selectedMedia.url} alt={product.name} />
              ) : (
                <video src={selectedMedia.url} controls />
              )
            ) : (
              <div className="no-media">No Media</div>
            )}

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

          {/* Details */}
          <div className="modal-details">
            <h2>{product.name}</h2>
            <p className="price">
              {formatCurrency(selectedVariant?.price || product.price || 0)}
            </p>
            <p className="desc">{product.description}</p>

            {variants.length > 0 && (
              <div className="variant-section">
                <div className="variant-group">
                  <span>Color:</span>
                  <div className="swatch-row">
                    {variants.map((v, i) => (
                      <button
                        key={i}
                        className={`swatch-btn ${
                          i === selectedVariantIndex ? "active" : ""
                        }`}
                        onClick={() => setSelectedVariantIndex(i)}
                      >
                        {v.color || "—"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="variant-group">
                  <span>Size:</span>
                  <div className="swatch-row">
                    {variants.map((v, i) => (
                      <button
                        key={i}
                        className={`swatch-btn ${
                          i === selectedVariantIndex ? "active" : ""
                        }`}
                        onClick={() => setSelectedVariantIndex(i)}
                      >
                        {v.size || "—"}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="stock">Stock: {selectedVariant?.stock ?? "N/A"}</p>
              </div>
            )}

            <button
              className="add-btn"
              disabled={selectedVariant?.stock === 0}
              onClick={() =>
                addToCart({
                  ...product,
                  variant: selectedVariant,
                })
              }
            >
              {selectedVariant?.stock === 0 ? "Out of Stock" : "Add to Cart"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
