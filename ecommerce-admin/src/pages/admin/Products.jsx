// src/pages/admin/Products.jsx
import "../../styles/products.css";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { db } from "../../firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import formatCurrency from "../../utils/formatCurrency";

export default function Products() {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();
  const { slug } = useParams();

  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(
        collection(db, "wholesalers", slug, "products")
      );
      const productsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(productsData);
    } catch (error) {
      console.error("Error fetching wholesaler products:", error);
    }
  };

  useEffect(() => {
    if (slug) fetchProducts();
  }, [slug]);

  const getImageUrl = (product) =>
    product.image || product.imageUrl || product.photo || "";

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteDoc(doc(db, "wholesalers", slug, "products", id));
        setProducts(products.filter((p) => p.id !== id));
        alert("Product deleted successfully.");
      } catch (error) {
        console.error("Error deleting product:", error);
        alert("Failed to delete product.");
      }
    }
  };

  const handleEdit = (id) => navigate(`/admin/${slug}/edit-product/${id}`);

  return (
    <div className="products">
      <div className="products-header">
        <h2>{slug ? `${slug}'s Products` : "Products"}</h2>
        <Link to={`/admin/${slug}/add-product`}>
          <button className="add-btn">+ Add Product</button>
        </Link>
      </div>

      {/* Desktop Table */}
      <div className="table-container">
        <table className="product-table">
          <thead>
            <tr>
              <th style={{ width: "80px" }}>Image</th>
              <th style={{ width: "25%" }}>Name</th>
              <th style={{ width: "100px" }}>Price</th>
              <th style={{ width: "80px" }}>Stock</th>
              <th style={{ width: "120px" }}>Category</th>
              <th style={{ width: "150px" }}>Actions</th>
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
                        />
                      ) : (
                        "No Image"
                      )}
                    </td>
                    <td>{product.name}</td>
                    <td>{formatCurrency(product.price || 0)}</td>
                    <td>{product.stock ?? "—"}</td>
                    <td>{product.category ?? "—"}</td>
                    <td>
                      <button
                        className="action-btn edit-btn"
                        onClick={() => handleEdit(product.id)}
                      >
                        Edit
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDelete(product.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="no-products">
                  No products available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Layout */}
      <div className="product-cards">
        {products.length > 0 ? (
          products.map((product) => {
            const imageUrl = getImageUrl(product);
            return (
              <div key={product.id} className="product-card">
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt={product.name}
                    className="product-card-img"
                  />
                )}
                <div className="product-card-body">
                  <h3>{product.name}</h3>
                  <p>Price: {formatCurrency(product.price || 0)}</p>
                  <p>Stock: {product.stock ?? "—"}</p>
                  <p>Category: {product.category ?? "—"}</p>
                  <div className="card-actions">
                    <button
                      className="action-btn edit-btn"
                      onClick={() => handleEdit(product.id)}
                    >
                      Edit
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={() => handleDelete(product.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="no-products">No products available</p>
        )}
      </div>
    </div>
  );
}
