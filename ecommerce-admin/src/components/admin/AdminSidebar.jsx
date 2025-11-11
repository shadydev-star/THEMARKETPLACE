// src/components/admin/AdminSidebar.jsx
import { Link, useParams, useLocation } from "react-router-dom";
import { FaTachometerAlt, FaBoxOpen, FaShoppingCart, FaUsers, FaStore, FaTimes } from "react-icons/fa";
import { useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import "../../styles/sidebar.css";

export default function AdminSidebar({ isOpen, toggleSidebar }) {
  const { slug } = useParams();
  const location = useLocation();
  const { isDarkMode } = useTheme();

  // Auto-close sidebar on mobile when route changes
  useEffect(() => {
    if (window.innerWidth < 768) {
      toggleSidebar();
    }
  }, [location.pathname]);

  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Sidebar */}
      <div
        className={`admin-sidebar ${isOpen ? "open" : ""} ${isDarkMode ? "dark-mode" : ""}`}
      >
        {/* Header */}
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-icon">🏪</div>
            <h3 className="brand-text">
              Wholesaler Panel
            </h3>
          </div>
          
          {/* Close button for mobile only */}
          <button className="sidebar-close" onClick={toggleSidebar}>
            <FaTimes />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <ul className="nav-list">
            <li className="nav-item">
              <Link 
                to={`/admin/${slug}`} 
                className={`nav-link ${isActiveLink(`/admin/${slug}`) ? "active" : ""}`}
                onClick={() => window.innerWidth < 768 && toggleSidebar()}
              >
                <FaTachometerAlt className="nav-icon" />
                <span className="nav-text">
                  Dashboard
                </span>
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                to={`/admin/${slug}/products`} 
                className={`nav-link ${isActiveLink(`/admin/${slug}/products`) ? "active" : ""}`}
                onClick={() => window.innerWidth < 768 && toggleSidebar()}
              >
                <FaBoxOpen className="nav-icon" />
                <span className="nav-text">
                  Products
                </span>
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                to={`/admin/${slug}/orders`} 
                className={`nav-link ${isActiveLink(`/admin/${slug}/orders`) ? "active" : ""}`}
                onClick={() => window.innerWidth < 768 && toggleSidebar()}
              >
                <FaShoppingCart className="nav-icon" />
                <span className="nav-text">
                  Orders
                </span>
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                to={`/admin/${slug}/users`} 
                className={`nav-link ${isActiveLink(`/admin/${slug}/users`) ? "active" : ""}`}
                onClick={() => window.innerWidth < 768 && toggleSidebar()}
              >
                <FaUsers className="nav-icon" />
                <span className="nav-text">
                  Users
                </span>
              </Link>
            </li>
          </ul>
        </nav>

        {/* Storefront Link */}
        <div className="sidebar-footer">
          <Link
            to={`/store/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="storefront-link"
            onClick={() => window.innerWidth < 768 && toggleSidebar()}
          >
            <FaStore className="nav-icon" />
            <span className="nav-text">
              View Storefront
            </span>
          </Link>
        </div>
      </div>

      {/* Overlay for mobile only */}
      {isOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}
    </>
  );
}