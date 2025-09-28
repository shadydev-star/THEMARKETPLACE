import "../../styles/topbar.css";

export default function AdminTopbar() {
  return (
    <div className="topbar">
      <h1>Dashboard</h1>
      <div className="actions">
        <button>Settings</button>
        <button>Logout</button>
      </div>
    </div>
  );
}
