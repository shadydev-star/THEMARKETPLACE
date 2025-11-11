// src/pages/admin/Users.jsx
import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { useTheme } from "../../context/ThemeContext";
import "../../styles/users.css";

export default function Users() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const customersCollection = collection(db, "customers");

    const unsub = onSnapshot(
      customersCollection,
      (snapshot) => {
        const fetched = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCustomers(fetched);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching customers:", error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [db]);

  if (loading) return <p className={`loading ${isDarkMode ? "dark-mode" : ""}`}>Loading customers...</p>;

  const filteredCustomers = customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`users ${isDarkMode ? "dark-mode" : ""}`}>
      <h2>Customers</h2>

      {/* Search */}
      <div className="users-search">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={isDarkMode ? "dark-mode" : ""}
        />
      </div>

      {/* Desktop Table */}
      <table className="users-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map((c) => (
              <tr key={c.id}>
                <td>{c.name || "—"}</td>
                <td>{c.email || "—"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="2" style={{ textAlign: "center", padding: "1rem" }}>
                No customers found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Mobile Card View */}
      <div className="users-cards">
        {filteredCustomers.map((c) => (
          <div className={`user-card ${isDarkMode ? "dark-mode" : ""}`} key={c.id}>
            <p>
              <strong>Name:</strong> {c.name || "—"}
            </p>
            <p>
              <strong>Email:</strong> {c.email || "—"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}