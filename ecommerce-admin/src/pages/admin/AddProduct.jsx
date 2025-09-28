// src/pages/admin/AddProduct.jsx
import { useState } from "react";
import { db } from "../../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { uploadImage } from "../../utils/cloudinary";

export default function AddProduct() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Upload image to Cloudinary
      let imageUrl = "";
      if (image) {
        imageUrl = await uploadImage(image);
      }

      // Save product to Firestore
      await addDoc(collection(db, "products"), {
        name,
        price: parseFloat(price),
        description,
        image: imageUrl, // ✅ standardized field name
        createdAt: serverTimestamp(), // ✅ better than new Date()
      });

      alert("Product added successfully ✅");
      setName("");
      setPrice("");
      setDescription("");
      setImage(null);
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Failed to add product ❌");
    }

    setLoading(false);
  };

  return (
    <div className="form-container">
      <h2>Add New Product</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Product Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <input
          type="file"
          onChange={(e) => setImage(e.target.files[0])}
          accept="image/*"
        />
        <button type="submit" disabled={loading}>
          {loading ? "Adding..." : "Add Product"}
        </button>
      </form>
    </div>
  );
}
