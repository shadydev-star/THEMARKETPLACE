// src/components/admin/AdminSidebar.jsx
import { Link, useParams } from "react-router-dom";
import { FaTachometerAlt, FaBoxOpen, FaShoppingCart, FaUsers, FaStore, FaTimes } from "react-icons/fa";

export default function AdminSidebar({ isOpen, toggleSidebar }) {
  const { slug } = useParams();

  return (
    <>
      {/* Sidebar */}
      <div
        className={`bg-light vh-100 p-3 sidebar position-fixed top-0 start-0 overflow-auto ${
          isOpen ? "open" : ""
        } d-md-block`}
      >
        {/* Close button for mobile */}
        <div className="d-md-none text-end mb-3">
          <button className="btn btn-outline-secondary" onClick={toggleSidebar}>
            <FaTimes />
          </button>
        </div>

        <h5 className="mb-4 text-center">Wholesaler Panel</h5>

        <ul className="nav flex-column">
          <li className="nav-item mb-2">
            <Link to={`/admin/${slug}`} className="nav-link text-dark d-flex align-items-center" onClick={toggleSidebar}>
              <FaTachometerAlt className="me-2" /> Dashboard
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link to={`/admin/${slug}/products`} className="nav-link text-dark d-flex align-items-center" onClick={toggleSidebar}>
              <FaBoxOpen className="me-2" /> Products
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link to={`/admin/${slug}/orders`} className="nav-link text-dark d-flex align-items-center" onClick={toggleSidebar}>
              <FaShoppingCart className="me-2" /> Orders
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link to={`/admin/${slug}/users`} className="nav-link text-dark d-flex align-items-center" onClick={toggleSidebar}>
              <FaUsers className="me-2" /> Users
            </Link>
          </li>
          <li className="nav-item mt-4">
            <Link
              to={`/store/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link text-primary d-flex align-items-center"
              onClick={toggleSidebar}
            >
              <FaStore className="me-2" /> My Storefront
            </Link>
          </li>
        </ul>
      </div>

      {/* Overlay for mobile */}
      {isOpen && <div className="sidebar-overlay d-md-none" onClick={toggleSidebar}></div>}

      <style>{`
        .sidebar {
        width: 200px;
        z-index: 1050;
        transform: translateX(-100%);
        transition: transform 0.3s ease;
      }
      .sidebar.open {
        transform: translateX(0);
      }
      .sidebar-overlay {
        position: fixed;
        top: 0;
        left: 0;
        height: 100vh;
        width: 100vw;
        background: rgba(0,0,0,0.4);
        z-index: 1040;
      }

      /* ✅ Make sidebar always visible on medium+ screens */
      @media (min-width: 768px) {
        .sidebar {
          transform: translateX(0) !important;
          position: fixed;
        }
      }

      `}</style>
    </>
  );
}
