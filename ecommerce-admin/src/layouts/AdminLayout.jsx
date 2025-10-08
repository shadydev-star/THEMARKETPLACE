// src/layouts/AdminLayout.jsx
import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/admin/AdminSidebar";
import AdminTopbar from "../components/admin/AdminTopbar";
import { useState } from "react";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div>
      {/* Sidebar */}
      <AdminSidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main content */}
      <div className="main-content">
        <AdminTopbar onToggleSidebar={toggleSidebar} />
        <div className="p-3">
          <Outlet />
        </div>
      </div>

      <style>{`
        .main-content {
          margin-left: 0;
          transition: margin-left 0.3s ease;
        }
        @media (min-width: 768px) {
          .main-content {
            margin-left: 220px; /* sidebar width */
          }
        }
      `}</style>
    </div>
  );
}
