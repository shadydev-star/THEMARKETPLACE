// src/components/admin/AdminTopbar.jsx
import { Button } from "react-bootstrap";
import { FaBars } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../pages/auth/AuthContext";


export default function AdminTopbar({ onToggleSidebar }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm px-3">
      <div className="container-fluid">
        {/* Hamburger toggle for mobile */}
        <Button
          variant="outline-secondary"
          size="sm"
          className="d-md-none me-2"
          onClick={onToggleSidebar}
        >
          <FaBars />
        </Button>

        <h4 className="navbar-brand mb-0">Dashboard</h4>

        <div className="d-flex ms-auto gap-2">
          <Button variant="outline-secondary" size="sm" onClick={() => alert("Settings clicked")}>
            Settings
          </Button>
          <Button variant="danger" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
}
