// src/pages/admin/AddProduct.jsx
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { db } from "../../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { uploadImage } from "../../utils/cloudinary";
import formatCurrency from "../../utils/formatCurrency";
import "../../styles/addproduct.css";

export default function AddProduct() {
  const { slug } = useParams();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showAlert, setShowAlert] = useState(false);

  // ✅ Auto-hide alert after 4 seconds
  useEffect(() => {
    if (message.text) {
      setShowAlert(true);
      const timer = setTimeout(() => setShowAlert(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !price || !description) {
      setMessage({ type: "error", text: "Please fill in all fields ❌" });
      return;
    }

    if (!slug) {
      setMessage({
        type: "error",
        text: "Wholesaler slug not found. Please reload the page.",
      });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      let imageUrl = "";
      if (image) {
        imageUrl = await uploadImage(image);
      }

      await addDoc(collection(db, "wholesalers", slug, "products"), {
        name,
        price: parseFloat(price),
        description,
        image: imageUrl,
        createdAt: serverTimestamp(),
      });

      setMessage({ type: "success", text: "✅ Product added successfully!" });

      // Reset form
      setName("");
      setPrice("");
      setDescription("");
      setImage(null);
      setPreview("");
    } catch (error) {
      console.error("Error adding product:", error);
      setMessage({
        type: "error",
        text: "❌ Failed to add product. Please try again.",
      });
    }

    setLoading(false);
  };

  return (
    <div className="addproduct-container">
      <h2 className="form-title">Add New Product</h2>

      {/* ✅ Auto-hiding Alert */}
      {message.text && (
        <div
          className={`custom-alert ${
            message.type === "success" ? "success" : "error"
          } ${showAlert ? "show" : "hide"}`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="addproduct-form">
        <div className="form-group">
          <label>Product Name</label>
          <input
            type="text"
            placeholder="Enter product name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Price (₦)</label>
          <input
            type="number"
            placeholder="Enter price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            min="1"
            required
          />
          {price && (
            <small className="price-preview">
              Preview: {formatCurrency(price)}
            </small>
          )}
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            placeholder="Enter product description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Product Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files[0];
              setImage(file);
              if (file) setPreview(URL.createObjectURL(file));
            }}
          />
        </div>

        {preview && (
          <div className="image-preview">
            <img src={preview} alt="Preview" />
          </div>
        )}

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Adding..." : "Add Product"}
        </button>
      </form>
    </div>
  );
}
