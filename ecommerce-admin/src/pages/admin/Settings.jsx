// src/pages/admin/Settings.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../../pages/auth/AuthContext";
import { db } from "../../firebase";
import { 
  doc, 
  getDoc, 
  setDoc
} from "firebase/firestore";
import { 
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from "firebase/auth";
import { auth } from "../../firebase";
import { useTheme } from "../../context/ThemeContext";
import { 
  FiBell,
  FiLock,
  FiGlobe,
  FiSave,
  FiEye,
  FiEyeOff,
  FiCheck,
  FiX,
  FiUser,
  FiMail,
  FiShield,
  FiShoppingCart,
  FiPackage,
  FiUsers,
  FiTrendingUp
} from "react-icons/fi";
import "../../styles/settings.css";

export default function Settings() {
  const { currentUser } = useAuth();
  const { isDarkMode } = useTheme();
  
  // Notification Preferences State
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    orderAlerts: true,
    lowStockAlerts: true,
    newCustomerAlerts: true,
    marketingEmails: false,
    smsNotifications: false
  });
  
  // Password Change State
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // App Settings State
  const [appSettings, setAppSettings] = useState({
    language: "en",
    timezone: "Africa/Lagos",
    currency: "NGN",
    dateFormat: "dd/MM/yyyy"
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("notifications");

  useEffect(() => {
    if (currentUser) {
      fetchSettings();
    }
  }, [currentUser]);

  const fetchSettings = async () => {
    try {
      const docRef = doc(db, "wholesalers", currentUser.uid, "settings", "preferences");
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.notifications) {
          setNotifications(data.notifications);
        }
        if (data.appSettings) {
          setAppSettings(data.appSettings);
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      setMessage({ type: "error", text: "Failed to load settings" });
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = (key, value) => {
    setNotifications(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAppSettingChange = (key, value) => {
    setAppSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const saveSettings = async () => {
    if (!currentUser) return;

    setSaving(true);
    try {
      const docRef = doc(db, "wholesalers", currentUser.uid, "settings", "preferences");
      await setDoc(docRef, {
        notifications,
        appSettings,
        updatedAt: new Date()
      }, { merge: true });
      
      setMessage({ type: "success", text: "Notification preferences saved successfully!" });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({ type: "error", text: "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      setMessage({ type: "error", text: "No user logged in" });
      return;
    }
    
    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setMessage({ type: "error", text: "Please fill in all password fields" });
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: "error", text: "New passwords don't match" });
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters" });
      return;
    }

    setChangingPassword(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("No authenticated user found");
      }

      const credential = EmailAuthProvider.credential(
        user.email,
        passwordData.currentPassword
      );
      
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, passwordData.newPassword);
      
      setMessage({ type: "success", text: "Password updated successfully!" });
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      
      setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 3000);
    } catch (error) {
      console.error("Error changing password:", error);
      
      switch (error.code) {
        case "auth/wrong-password":
          setMessage({ type: "error", text: "Current password is incorrect" });
          break;
        case "auth/weak-password":
          setMessage({ type: "error", text: "New password is too weak. Please choose a stronger password" });
          break;
        case "auth/requires-recent-login":
          setMessage({ type: "error", text: "For security, please log in again before changing your password" });
          break;
        case "auth/network-request-failed":
          setMessage({ type: "error", text: "Network error. Please check your connection and try again" });
          break;
        default:
          setMessage({ type: "error", text: "Failed to change password. Please try again" });
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const resetToDefaults = () => {
    setNotifications({
      emailNotifications: true,
      orderAlerts: true,
      lowStockAlerts: true,
      newCustomerAlerts: true,
      marketingEmails: false,
      smsNotifications: false
    });
    
    setAppSettings({
      language: "en",
      timezone: "Africa/Lagos",
      currency: "NGN",
      dateFormat: "dd/MM/yyyy"
    });
    
    setMessage({ type: "success", text: "Settings reset to defaults" });
    
    setTimeout(() => {
      setMessage({ type: "", text: "" });
    }, 3000);
  };

  // Test notification function (for demo purposes)
  const testNotification = async (type) => {
    if (!currentUser) return;

    try {
      const testNotifications = {
        order: {
          title: "New Order Received!",
          message: "You have a new order from Customer #12345",
          type: "order"
        },
        lowStock: {
          title: "Low Stock Alert",
          message: "Product 'Premium Widget' is running low (5 items left)",
          type: "low_stock"
        },
        newCustomer: {
          title: "New Customer Registered",
          message: "John Doe has registered in your store",
          type: "new_customer"
        }
      };

      const notification = testNotifications[type];
      if (!notification) return;

      // Check if this notification type is enabled
      if (
        (type === 'order' && !notifications.orderAlerts) ||
        (type === 'lowStock' && !notifications.lowStockAlerts) ||
        (type === 'newCustomer' && !notifications.newCustomerAlerts)
      ) {
        setMessage({ type: "error", text: `This notification type is currently disabled in your settings` });
        return;
      }

      const notificationRef = doc(collection(db, "wholesalers", currentUser.uid, "notifications"));
      await setDoc(notificationRef, {
        ...notification,
        read: false,
        createdAt: new Date()
      });

      setMessage({ type: "success", text: `Test ${type} notification sent!` });
      
      setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 3000);
    } catch (error) {
      console.error("Error sending test notification:", error);
      setMessage({ type: "error", text: "Failed to send test notification" });
    }
  };

  if (loading) {
    return (
      <div className={`settings-loading ${isDarkMode ? "dark" : ""}`}>
        <div className="loading-spinner"></div>
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className={`settings-page ${isDarkMode ? "dark" : ""}`}>
      {/* Header Section */}
      <div className="settings-header">
        <div className="header-content">
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account preferences and security settings</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-secondary"
            onClick={resetToDefaults}
          >
            Reset to Defaults
          </button>
          <button 
            onClick={saveSettings}
            disabled={saving}
            className={`btn-primary ${saving ? "loading" : ""}`}
          >
            {saving ? (
              <>
                <div className="spinner"></div>
                Saving...
              </>
            ) : (
              <>
                <FiSave size={16} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Alert Message */}
      {message.text && (
        <div className={`alert-message ${message.type}`}>
          <div className="alert-content">
            {message.type === "success" ? <FiCheck size={18} /> : <FiX size={18} />}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      <div className="settings-layout">
        {/* Sidebar Navigation */}
        <div className="settings-sidebar">
          <nav className="sidebar-nav">
            <button 
              className={`nav-item ${activeTab === "notifications" ? "active" : ""}`}
              onClick={() => setActiveTab("notifications")}
            >
              <FiBell size={20} />
              <span>Notifications</span>
            </button>
            
            <button 
              className={`nav-item ${activeTab === "security" ? "active" : ""}`}
              onClick={() => setActiveTab("security")}
            >
              <FiLock size={20} />
              <span>Security</span>
            </button>
            
            <button 
              className={`nav-item ${activeTab === "preferences" ? "active" : ""}`}
              onClick={() => setActiveTab("preferences")}
            >
              <FiGlobe size={20} />
              <span>Preferences</span>
            </button>
            
            <button 
              className={`nav-item ${activeTab === "account" ? "active" : ""}`}
              onClick={() => setActiveTab("account")}
            >
              <FiUser size={20} />
              <span>Account</span>
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="settings-content">
          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="settings-section">
              <div className="section-header">
                <FiBell size={24} className="section-icon" />
                <div>
                  <h2>Notification Preferences</h2>
                  <p>Control which notifications you receive in your dashboard</p>
                </div>
              </div>

              <div className="settings-grid">
                <div className="setting-card">
                  <div className="setting-info">
                    <div className="setting-icon">
                      <FiBell size={20} />
                    </div>
                    <div>
                      <h3>Email Notifications</h3>
                      <p>Receive important updates and alerts via email</p>
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={notifications.emailNotifications}
                      onChange={(e) => handleNotificationChange("emailNotifications", e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-card">
                  <div className="setting-info">
                    <div className="setting-icon">
                      <FiShoppingCart size={20} />
                    </div>
                    <div>
                      <h3>Order Alerts</h3>
                      <p>Get notified when new orders are placed</p>
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={notifications.orderAlerts}
                      onChange={(e) => handleNotificationChange("orderAlerts", e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-card">
                  <div className="setting-info">
                    <div className="setting-icon">
                      <FiPackage size={20} />
                    </div>
                    <div>
                      <h3>Low Stock Alerts</h3>
                      <p>Receive warnings when products are running low</p>
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={notifications.lowStockAlerts}
                      onChange={(e) => handleNotificationChange("lowStockAlerts", e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-card">
                  <div className="setting-info">
                    <div className="setting-icon">
                      <FiUsers size={20} />
                    </div>
                    <div>
                      <h3>New Customer Alerts</h3>
                      <p>Get notified when new customers register</p>
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={notifications.newCustomerAlerts}
                      onChange={(e) => handleNotificationChange("newCustomerAlerts", e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-card">
                  <div className="setting-info">
                    <div className="setting-icon">
                      <FiTrendingUp size={20} />
                    </div>
                    <div>
                      <h3>Marketing Emails</h3>
                      <p>Receive promotional offers and business updates</p>
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={notifications.marketingEmails}
                      onChange={(e) => handleNotificationChange("marketingEmails", e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-card">
                  <div className="setting-info">
                    <div className="setting-icon">
                      <FiBell size={20} />
                    </div>
                    <div>
                      <h3>SMS Notifications</h3>
                      <p>Receive critical alerts via SMS (if configured)</p>
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={notifications.smsNotifications}
                      onChange={(e) => handleNotificationChange("smsNotifications", e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

    
            </div>
          )}

          {/* Other tabs remain the same */}
          {activeTab === "security" && (
            <div className="settings-section">
              {/* Security tab content - same as before */}
              <div className="section-header">
                <FiLock size={24} className="section-icon" />
                <div>
                  <h2>Security Settings</h2>
                  <p>Manage your password and account security</p>
                </div>
              </div>

              <form onSubmit={changePassword} className="security-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Current Password</label>
                    <div className="input-with-icon">
                      <input
                        type={showPasswords.current ? "text" : "password"}
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        required
                        placeholder="Enter your current password"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => togglePasswordVisibility("current")}
                      >
                        {showPasswords.current ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>New Password</label>
                    <div className="input-with-icon">
                      <input
                        type={showPasswords.new ? "text" : "password"}
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        required
                        placeholder="Enter new password"
                        minLength="6"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => togglePasswordVisibility("new")}
                      >
                        {showPasswords.new ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <div className="input-with-icon">
                      <input
                        type={showPasswords.confirm ? "text" : "password"}
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        required
                        placeholder="Confirm your new password"
                        minLength="6"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => togglePasswordVisibility("confirm")}
                      >
                        {showPasswords.confirm ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="password-requirements">
                  <h4>Password Requirements</h4>
                  <ul>
                    <li>At least 6 characters long</li>
                    <li>Should not be easily guessable</li>
                    <li>Consider using a mix of letters, numbers, and symbols</li>
                  </ul>
                </div>

                <div className="form-actions">
                  <button 
                    type="submit"
                    disabled={changingPassword || !passwordData.currentPassword || !passwordData.newPassword}
                    className={`btn-primary ${changingPassword ? "loading" : ""}`}
                  >
                    {changingPassword ? (
                      <>
                        <div className="spinner"></div>
                        Updating Password...
                      </>
                    ) : (
                      <>
                        <FiShield size={16} />
                        Change Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Preferences and Account tabs remain the same */}
          {activeTab === "preferences" && (
            <div className="settings-section">
              <div className="section-header">
                <FiGlobe size={24} className="section-icon" />
                <div>
                  <h2>Application Preferences</h2>
                  <p>Customize your application experience</p>
                </div>
              </div>

              <div className="preferences-grid">
                <div className="preference-group">
                  <label>Language</label>
                  <select
                    value={appSettings.language}
                    onChange={(e) => handleAppSettingChange("language", e.target.value)}
                  >
                    <option value="en">English</option>
                    <option value="fr">French</option>
                    <option value="es">Spanish</option>
                  </select>
                </div>

                <div className="preference-group">
                  <label>Timezone</label>
                  <select
                    value={appSettings.timezone}
                    onChange={(e) => handleAppSettingChange("timezone", e.target.value)}
                  >
                    <option value="Africa/Lagos">West Africa Time (WAT)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time (ET)</option>
                  </select>
                </div>

                <div className="preference-group">
                  <label>Currency</label>
                  <select
                    value={appSettings.currency}
                    onChange={(e) => handleAppSettingChange("currency", e.target.value)}
                  >
                    <option value="NGN">Nigerian Naira (₦)</option>
                    <option value="USD">US Dollar ($)</option>
                    <option value="EUR">Euro (€)</option>
                    <option value="GBP">British Pound (£)</option>
                  </select>
                </div>

                <div className="preference-group">
                  <label>Date Format</label>
                  <select
                    value={appSettings.dateFormat}
                    onChange={(e) => handleAppSettingChange("dateFormat", e.target.value)}
                  >
                    <option value="dd/MM/yyyy">DD/MM/YYYY</option>
                    <option value="MM/dd/yyyy">MM/DD/YYYY</option>
                    <option value="yyyy-MM-dd">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === "account" && (
            <div className="settings-section">
              <div className="section-header">
                <FiUser size={24} className="section-icon" />
                <div>
                  <h2>Account Information</h2>
                  <p>Manage your account details and preferences</p>
                </div>
              </div>

              <div className="account-info">
                <div className="info-item">
                  <label>Email Address</label>
                  <div className="info-value">
                    <FiMail size={16} />
                    <span>{currentUser?.email}</span>
                  </div>
                </div>

                <div className="info-item">
                  <label>Account Status</label>
                  <div className="info-value status-verified">
                    <FiCheck size={16} />
                    <span>Verified</span>
                  </div>
                </div>

                <div className="info-item">
                  <label>Member Since</label>
                  <div className="info-value">
                    <span>{currentUser?.metadata?.creationTime ? 
                      new Date(currentUser.metadata.creationTime).toLocaleDateString() : 
                      'N/A'
                    }</span>
                  </div>
                </div>

                <div className="info-item">
                  <label>Last Login</label>
                  <div className="info-value">
                    <span>{currentUser?.metadata?.lastSignInTime ? 
                      new Date(currentUser.metadata.lastSignInTime).toLocaleDateString() : 
                      'N/A'
                    }</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}