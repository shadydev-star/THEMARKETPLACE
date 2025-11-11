// src/components/admin/AdminTopbar.jsx
import { useEffect, useState, useRef } from "react";
import { Dropdown, Toast, ToastContainer } from "react-bootstrap";
import { 
  FaBars, 
  FaBell, 
  FaCog, 
  FaSignOutAlt, 
  FaUser, 
  FaChevronDown,
  FaSun,
  FaMoon 
} from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../pages/auth/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import "../../styles/topbar.css";

export default function AdminTopbar({ onToggleSidebar }) { 
  const { slug } = useParams();
  const { currentUser, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [profile, setProfile] = useState(null);
  const [notificationSettings, setNotificationSettings] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [clickedNotifId, setClickedNotifId] = useState(null);
  const prevNotifCount = useRef(0);

  const toastRef = useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // 🔔 Fetch notification settings
  useEffect(() => {
    if (!currentUser) return;
    
    const fetchNotificationSettings = async () => {
      try {
        const settingsRef = doc(db, "wholesalers", currentUser.uid, "settings", "preferences");
        const settingsSnap = await getDoc(settingsRef);
        
        if (settingsSnap.exists()) {
          setNotificationSettings(settingsSnap.data().notifications);
        } else {
          // Default settings if none exist
          setNotificationSettings({
            emailNotifications: true,
            orderAlerts: true,
            lowStockAlerts: true,
            newCustomerAlerts: true,
            marketingEmails: false,
            smsNotifications: false
          });
        }
      } catch (error) {
        console.error("Error fetching notification settings:", error);
      }
    };

    fetchNotificationSettings();
  }, [currentUser]);

  // 🔔 Real-time notifications listener
  useEffect(() => {
    if (!currentUser) return;
    
    const notifRef = collection(db, "wholesalers", currentUser.uid, "notifications");
    const unsubscribe = onSnapshot(notifRef, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const sorted = data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      
      setNotifications(sorted);

      // Show toast for new notifications
      if (prevNotifCount.current !== null && sorted.length > prevNotifCount.current) {
        const newNotifications = sorted.slice(0, sorted.length - prevNotifCount.current);
        if (newNotifications.length > 0) {
          const latest = newNotifications[0];
          setToastMessage(`${latest.title}: ${latest.message}`);
          setClickedNotifId(latest.id);
          setShowToast(true);
        }
      }
      prevNotifCount.current = sorted.length;
    });
    
    return () => unsubscribe();
  }, [currentUser]);

  // 👤 Fetch profile data
  useEffect(() => {
    if (currentUser) {
      fetchProfile();
    }
  }, [currentUser]);

  const fetchProfile = async () => {
    try {
      const docRef = doc(db, "wholesalers", currentUser.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setProfile(docSnap.data());
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

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
    setDropdownOpen(true);
    setShowToast(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <nav className="admin-topbar">
        <div className="topbar-content">
          {/* Left Section - Menu Toggle & Title */}
          <div className="topbar-left">
            <button 
              className="sidebar-toggle"
              onClick={onToggleSidebar}
            >
              <FaBars />
            </button>
            <div className="page-info">
              <h1 className="page-title">Dashboard</h1>
              <span className="page-subtitle">
                Welcome back, {profile?.businessName || currentUser?.displayName || "Admin"}!
              </span>
            </div>
          </div>

          {/* Right Section - Actions & Profile */}
          <div className="topbar-right">
            {/* Theme Toggle */}
            <button 
              className="theme-toggle"
              onClick={toggleTheme}
              title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? <FaSun /> : <FaMoon />}
            </button>

            {/* Notifications */}
            <Dropdown align="end" show={dropdownOpen} onToggle={setDropdownOpen}>
              <Dropdown.Toggle as="div" className="notification-toggle">
                <div className="notification-icon">
                  <FaBell />
                  {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                  )}
                </div>
              </Dropdown.Toggle>

              <Dropdown.Menu className="notification-dropdown">
                <div className="notification-header">
                  <h3>Notifications</h3>
                  {notifications.length > 0 && (
                    <button 
                      className="clear-all-btn"
                      onClick={clearAll}
                    >
                      Clear All
                    </button>
                  )}
                </div>
                
                <div className="notification-list">
                  {notifications.length === 0 ? (
                    <div className="empty-notifications">
                      <FaBell className="empty-icon" />
                      <p>No notifications</p>
                      <span>You're all caught up!</span>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`notification-item ${notif.read ? 'read' : 'unread'}`}
                        onClick={() => markAsRead(notif.id)}
                      >
                        <div className="notification-dot"></div>
                        <div className="notification-content">
                          <div className="notification-title">{notif.title}</div>
                          <div className="notification-message">{notif.message}</div>
                          <div className="notification-time">
                            {notif.createdAt?.toDate?.().toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Dropdown.Menu>
            </Dropdown>

            {/* Profile Dropdown */}
            <Dropdown align="end" show={profileDropdownOpen} onToggle={setProfileDropdownOpen}>
              <Dropdown.Toggle as="div" className="profile-toggle">
                <div className="profile-avatar">
                  {profile?.profilePicture ? (
                    <img src={profile.profilePicture} alt="Profile" />
                  ) : currentUser?.photoURL ? (
                    <img src={currentUser.photoURL} alt="Profile" />
                  ) : (
                    <div className="avatar-placeholder">
                      <FaUser />
                    </div>
                  )}
                </div>
                <div className="profile-info">
                  <span className="profile-name">
                    {profile?.businessName || currentUser?.displayName || "Admin User"}
                  </span>
                  <span className="profile-role">Administrator</span>
                </div>
                <FaChevronDown className="dropdown-arrow" />
              </Dropdown.Toggle>

              <Dropdown.Menu className="profile-dropdown">
                <Dropdown.Item 
                  className="profile-dropdown-item"
                  onClick={() => navigate(`/admin/${slug}/profile`)}
                >
                  <FaUser className="dropdown-icon" />
                  <span>My Profile</span>
                </Dropdown.Item>
                <Dropdown.Item 
                  className="profile-dropdown-item"
                  onClick={() => navigate(`/admin/${slug}/settings`)}
                >
                  <FaCog className="dropdown-icon" />
                  <span>Settings</span>
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item 
                  className="profile-dropdown-item logout-item"
                  onClick={handleLogout}
                >
                  <FaSignOutAlt className="dropdown-icon" />
                  <span>Logout</span>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>
      </nav>

      {/* Modern Toast Notification */}
      <ToastContainer position="top-end" className="p-3">
        <Toast
          ref={toastRef}
          show={showToast}
          onClose={() => setShowToast(false)}
          delay={4000}
          autohide
          className="modern-toast"
          onClick={handleToastClick}
        >
          <Toast.Header className="toast-header">
            <FaBell className="toast-icon" />
            <strong className="me-auto">New Notification</strong>
            <small>just now</small>
          </Toast.Header>
          <Toast.Body>{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
}