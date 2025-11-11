// src/layouts/AdminLayout.jsx
import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/admin/AdminSidebar";
import AdminTopbar from "../components/admin/AdminTopbar";
import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isDarkMode } = useTheme();
  
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className={`admin-layout ${sidebarOpen ? 'sidebar-open' : ''} ${isDarkMode ? 'dark-mode' : ''}`}>
      {/* Sidebar - Always expanded on desktop, no collapse functionality */}
      <AdminSidebar 
        isOpen={sidebarOpen} 
        toggleSidebar={toggleSidebar}
      />

      {/* Main content */}
      <div className="main-content">
        <AdminTopbar 
          onToggleSidebar={toggleSidebar} 
        />
        <div className="content-area">
          <Outlet />
        </div>
      </div>

      <style >{`
        .admin-layout {
          min-height: 100vh;
          background: #f8fafc;
        }

        .main-content {
          margin-left: 280px;
          transition: margin-left 0.3s ease;
          min-height: 100vh;
        }

        .content-area {
          padding: 2rem;
          margin-top: 80px;
          max-width: 1200px;
        }

        /* Mobile styles */
        @media (max-width: 767px) {
          .main-content {
            margin-left: 0 !important;
          }

          .content-area {
            margin-top: 70px;
            padding: 1rem;
          }
        }

        /* Large screens */
        @media (min-width: 1200px) {
          .content-area {
            margin-left: auto;
            margin-right: auto;
          }
        }
      `}</style>
    </div>
  );
}