// src/pages/admin/EditProduct.jsx
import "../../styles/editproduct.css";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { uploadImage } from "../../utils/cloudinary";
import { useDropzone } from "react-dropzone";

export default function EditProduct() {
  const { slug, id } = useParams(); // ✅ includes wholesaler slug
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [variants, setVariants] = useState([]);

  // 🧩 Fetch product for this wholesaler
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const docRef = doc(db, "wholesalers", slug, "products", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProduct({ id: docSnap.id, ...data });
          setVariants(
            (data.variants || []).map((v) => ({
              ...v,
              newImages: [],
            }))
          );
        } else {
          alert("Product not found");
          navigate(`/admin/${slug}/products`);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug, id, navigate]);

  const handleChange = (e) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
  };

  // ✅ Auto-sync total stock when variant stock changes
  const handleVariantChange = (index, field, value) => {
    const updated = [...variants];
    updated[index][field] = value;

    if (field === "stock") {
      const totalStock = updated.reduce(
        (sum, v) => sum + (Number(v.stock) || 0),
        0
      );
      setProduct((prev) => ({ ...prev, stock: totalStock }));
    }

    setVariants(updated);
  };

  // ✅ Keep total stock synced when adding/removing variants
  const addVariant = () => {
    const newVariant = {
      color: "",
      size: "",
      price: "",
      stock: "",
      images: [],
      newImages: [],
    };
    const updated = [...variants, newVariant];

    const totalStock = updated.reduce(
      (sum, v) => sum + (Number(v.stock) || 0),
      0
    );

    setVariants(updated);
    setProduct((prev) => ({ ...prev, stock: totalStock }));
  };

  const removeVariant = (index) => {
    const updated = variants.filter((_, i) => i !== index);

    const totalStock = updated.reduce(
      (sum, v) => sum + (Number(v.stock) || 0),
      0
    );

    setVariants(updated);
    setProduct((prev) => ({ ...prev, stock: totalStock }));
  };

  const handleDrop = (index, acceptedFiles) => {
    const updated = [...variants];
    updated[index].newImages = [
      ...(updated[index].newImages || []),
      ...acceptedFiles.map((file) =>
        Object.assign(file, { preview: URL.createObjectURL(file) })
      ),
    ];
    setVariants(updated);
  };

  const removeImage = (variantIndex, imgIndex, type) => {
    const updated = [...variants];
    if (type === "new") {
      updated[variantIndex].newImages = updated[variantIndex].newImages.filter(
        (_, i) => i !== imgIndex
      );
    } else {
      updated[variantIndex].images = updated[variantIndex].images.filter(
        (_, i) => i !== imgIndex
      );
    }
    setVariants(updated);
  };

  const moveImage = (variantIndex, fromIndex, toIndex, type) => {
    const updated = [...variants];
    const arr =
      type === "new" ? updated[variantIndex].newImages : updated[variantIndex].images;
    const [moved] = arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, moved);
    setVariants(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updatedVariants = await Promise.all(
        variants.map(async (variant) => {
          let mediaUrls = [...(variant.images || [])];

          if (variant.newImages && variant.newImages.length > 0) {
            const uploads = await Promise.all(
              variant.newImages.map((file) => uploadImage(file))
            );
            mediaUrls = [...mediaUrls, ...uploads];
          }

          return {
            color: variant.color || "",
            size: variant.size || "",
            price: Number(variant.price) || 0,
            stock: Number(variant.stock) || 0,
            images: mediaUrls,
          };
        })
      );

      const docRef = doc(db, "wholesalers", slug, "products", id);
      await updateDoc(docRef, {
        name: product.name,
        price: Number(product.price),
        stock: Number(product.stock),
        category: product.category || "",
        description: product.description || "",
        variants: updatedVariants,
        updatedAt: serverTimestamp(),
      });

      alert("Product updated successfully!");
      navigate(`/admin/${slug}/products`);
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Failed to update product.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading product...</p>;
  if (!product) return null;

  return (
    <div className="edit-product">
      <h2>Edit Product ({product.name})</h2>
      <form onSubmit={handleSubmit} className="product-form">
        <label>
          Name:
          <input
            type="text"
            name="name"
            value={product.name || ""}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Price:
          <input
            type="number"
            name="price"
            value={product.price || ""}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Stock:
          <input
            type="number"
            name="stock"
            value={product.stock || ""}
            onChange={handleChange}
            readOnly={variants.length > 0} // 🔒 auto-managed if variants exist
          />
        </label>

        <label>
          Category:
          <input
            type="text"
            name="category"
            value={product.category || ""}
            onChange={handleChange}
          />
        </label>

        <label>
          Description:
          <textarea
            name="description"
            value={product.description || ""}
            onChange={handleChange}
          />
        </label>

        {/* 🧩 Variants Section */}
        <div className="variants-section">
          <h3>Variants</h3>
          {variants.map((variant, index) => (
            <div key={index} className="variant-row">
              <input
                type="text"
                placeholder="Color"
                value={variant.color}
                onChange={(e) =>
                  handleVariantChange(index, "color", e.target.value)
                }
              />
              <input
                type="text"
                placeholder="Size"
                value={variant.size}
                onChange={(e) =>
                  handleVariantChange(index, "size", e.target.value)
                }
              />
              <input
                type="number"
                placeholder="Price"
                value={variant.price}
                onChange={(e) =>
                  handleVariantChange(index, "price", e.target.value)
                }
              />
              <input
                type="number"
                placeholder="Stock"
                value={variant.stock}
                onChange={(e) =>
                  handleVariantChange(index, "stock", e.target.value)
                }
              />
              <button type="button" onClick={() => removeVariant(index)}>
                Remove
              </button>

              <VariantDropzone
                variantIndex={index}
                variant={variant}
                onDrop={handleDrop}
                removeImage={removeImage}
                moveImage={moveImage}
              />
            </div>
          ))}
          <button type="button" onClick={addVariant}>
            + Add Variant
          </button>
        </div>

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Update Product"}
        </button>
      </form>
    </div>
  );
}

// 🧩 Reusable Dropzone Component
function VariantDropzone({ variantIndex, variant, onDrop, removeImage, moveImage }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [], "video/*": [] },
    onDrop: (files) => onDrop(variantIndex, files),
    multiple: true,
  });

  const handleReorder = (arrType, i, direction) => {
    const arr = arrType === "new" ? variant.newImages : variant.images;
    const toIndex = i + direction;
    if (toIndex >= 0 && toIndex < arr.length) {
      moveImage(variantIndex, i, toIndex, arrType);
    }
  };

  return (
    <div {...getRootProps()} className={`dropzone ${isDragActive ? "active" : ""}`}>
      <input {...getInputProps()} />
      <div className="dropzone-placeholder">
        {isDragActive ? "Drop here..." : "+ Add Images or Videos"}
      </div>

      <div className="image-previews">
        {variant.images?.map((url, i) => (
          <div key={`ex-${i}`} className="preview-wrapper">
            {url.match(/\.(mp4|mov|webm)$/i) ? (
              <video src={url} controls className="preview-media" />
            ) : (
              <img src={url} alt="existing" className="preview-img" />
            )}
            <button
              type="button"
              className="remove-img"
              onClick={(e) => {
                e.stopPropagation();
                removeImage(variantIndex, i, "existing");
              }}
            >
              ×
            </button>
            <div className="reorder-controls">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReorder("existing", i, -1);
                }}
              >
                ←
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReorder("existing", i, 1);
                }}
              >
                →
              </button>
            </div>
          </div>
        ))}

        {variant.newImages?.map((file, i) => (
          <div key={`new-${i}`} className="preview-wrapper">
            {file.type.startsWith("video/") ? (
              <video src={file.preview} controls className="preview-media" />
            ) : (
              <img src={file.preview} alt="preview" className="preview-img" />
            )}
            <button
              type="button"
              className="remove-img"
              onClick={(e) => {
                e.stopPropagation();
                removeImage(variantIndex, i, "new");
              }}
            >
              ×
            </button>
            <div className="reorder-controls">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReorder("new", i, -1);
                }}
              >
                ←
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReorder("new", i, 1);
                }}
              >
                →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
