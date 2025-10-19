// src/components/admin/AdminTopbar.jsx
import { useEffect, useState, useRef } from "react";
import { Button, Dropdown, Toast, ToastContainer } from "react-bootstrap";
import { FaBars, FaBell } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../pages/auth/AuthContext";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebase";

export default function AdminTopbar({ onToggleSidebar }) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [clickedNotifId, setClickedNotifId] = useState(null);
  const prevNotifCount = useRef(0);

  const toastRef = useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // 🔔 Real-time notifications listener
  useEffect(() => {
    if (!currentUser) return;
    const notifRef = collection(db, "wholesalers", currentUser.uid, "notifications");
    const unsubscribe = onSnapshot(notifRef, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const sorted = data.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
      setNotifications(sorted);

      if (prevNotifCount.current && sorted.length > prevNotifCount.current) {
        const latest = sorted[0];
        setToastMessage(`${latest.title}: ${latest.message}`);
        setClickedNotifId(latest.id); // store the notification ID for click
        setShowToast(true);
      }
      prevNotifCount.current = sorted.length;
    });
    return () => unsubscribe();
  }, [currentUser]);

  // ✅ Mark one notification as read
  const markAsRead = async (id) => {
    try {
      const notifRef = doc(db, "wholesalers", currentUser.uid, "notifications", id);
      await updateDoc(notifRef, { read: true });
      setClickedNotifId(null);
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  // 🗑️ Clear all notifications
  const clearAll = async () => {
    try {
      const batchPromises = notifications.map((n) =>
        deleteDoc(doc(db, "wholesalers", currentUser.uid, "notifications", n.id))
      );
      await Promise.all(batchPromises);
      setToastMessage("All notifications cleared ✅");
      setShowToast(true);
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  const handleToastClick = () => {
    if (clickedNotifId) {
      markAsRead(clickedNotifId);
    }
    setDropdownOpen(true); // open dropdown when toast clicked
    setShowToast(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm px-3">
        <div className="container-fluid">
          <Button
            variant="outline-secondary"
            size="sm"
            className="d-md-none me-2"
            onClick={onToggleSidebar}
          >
            <FaBars />
          </Button>

          <h4 className="navbar-brand mb-0">Dashboard</h4>

          <div className="d-flex align-items-center ms-auto gap-3">
            {/* 🔔 Notifications dropdown */}
            <Dropdown align="end" show={dropdownOpen} onToggle={setDropdownOpen}>
              <Dropdown.Toggle variant="light" id="dropdown-notifications">
                <FaBell />
                {notifications.some((n) => !n.read) && (
                  <span className="badge bg-danger ms-1">
                    {notifications.filter((n) => !n.read).length}
                  </span>
                )}
              </Dropdown.Toggle>

              <Dropdown.Menu style={{ width: "320px" }}>
                <div className="d-flex justify-content-between align-items-center px-3">
                  <strong>Notifications</strong>
                  {notifications.length > 0 && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={clearAll}
                      style={{ textDecoration: "none" }}
                    >
                      Clear All
                    </Button>
                  )}
                </div>
                <Dropdown.Divider />

                {notifications.length === 0 ? (
                  <p className="text-center text-muted m-2">No notifications</p>
                ) : (
                  notifications.map((notif) => (
                    <Dropdown.Item
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      style={{
                        whiteSpace: "normal",
                        backgroundColor: notif.read ? "#f8f9fa" : "#e7f3ff",
                      }}
                    >
                      <strong>{notif.title}</strong>
                      <br />
                      <small className="text-muted">{notif.message}</small>
                    </Dropdown.Item>
                  ))
                )}
              </Dropdown.Menu>
            </Dropdown>

            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => alert("Settings clicked")}
            >
              Settings
            </Button>

            <Button variant="danger" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </nav>

      {/* ✅ Clickable Top-right Toast Notification */}
      <ToastContainer position="top-end" className="p-3">
        <Toast
          ref={toastRef}
          show={showToast}
          bg="success"
          onClose={() => setShowToast(false)}
          delay={3000}
          autohide
          style={{ cursor: "pointer" }}
          onClick={handleToastClick}
        >
          <Toast.Body className="text-white">{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
}
