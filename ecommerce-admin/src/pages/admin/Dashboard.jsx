import "../../styles/dashboard.css";

export default function Dashboard() {
  return (
    <div className="dashboard">
      <h2>Admin Dashboard</h2>
      <div className="stat-grid">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p>1,245</p>
        </div>
        <div className="stat-card">
          <h3>Total Orders</h3>
          <p>320</p>
        </div>
        <div className="stat-card">
          <h3>Total Products</h3>
          <p>89</p>
        </div>
        <div className="stat-card">
          <h3>Revenue</h3>
          <p>$12,450</p>
        </div>
      </div>
    </div>
  );
}
