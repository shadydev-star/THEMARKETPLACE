// src/pages/admin/Products.jsx
import "../../styles/products.css";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";

export default function Products() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const productsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log("Fetched products:", productsData); // <-- inspect fields in browser console
        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, []);

  // helper to pick the image URL from multiple possible field names
  const getImageUrl = (product) => {
    // check several common field names (case-sensitive)
    return (
      product.image ||
      product.imageUrl ||
      product.image_url ||
      product.imageURL ||
      product.url ||
      product.photo ||
      product.photoUrl ||
      ""
    );
  };

  return (
    <div className="products">
      <div className="products-header">
        <h2>Products</h2>
        <Link to="/admin/add-product">
          <button className="add-btn">+ Add Product</button>
        </Link>
      </div>

      <table>
        <thead>
          <tr>
            <th style={{width: 80}}>Image</th>
            <th>Name</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Category</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.length > 0 ? (
            products.map((product) => {
              const imageUrl = getImageUrl(product);
              return (
                <tr key={product.id}>
                  <td>
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={product.name || "product"}
                        className="product-img"
                        onError={(e) => {
                          // hide broken images and fallback to text
                          e.currentTarget.style.display = "none";
                          e.currentTarget.alt = "Image unavailable";
                        }}
                      />
                    ) : (
                      "No Image"
                    )}
                  </td>
                  <td>{product.name}</td>
                  <td>${product.price}</td>
                  <td>{product.stock ?? "—"}</td>
                  <td>{product.category ?? "—"}</td>
                  <td>
                    <button className="action-btn edit-btn">Edit</button>
                    <button className="action-btn delete-btn">Delete</button>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="6">No products available</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
