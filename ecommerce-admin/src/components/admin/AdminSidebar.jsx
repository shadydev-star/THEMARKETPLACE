import { Link } from "react-router-dom";
import { FaTachometerAlt, FaBoxOpen, FaShoppingCart, FaUsers } from "react-icons/fa";
import "../../styles/sidebar.css";

export default function AdminSidebar() {
  return (
    <div className="sidebar">
      <h2>Admin</h2>
      <Link to="/admin">
        <FaTachometerAlt style={{ marginRight: "8px" }} />
        Dashboard
      </Link>
      <Link to="/admin/products">
        <FaBoxOpen style={{ marginRight: "8px" }} />
        Products
      </Link>
      <Link to="/admin/orders">
        <FaShoppingCart style={{ marginRight: "8px" }} />
        Orders
      </Link>
      <Link to="/admin/users">
        <FaUsers style={{ marginRight: "8px" }} />
        Users
      </Link>
    </div>
  );
}
