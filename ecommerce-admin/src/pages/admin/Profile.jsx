// src/pages/admin/Profile.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../../pages/auth/AuthContext";
import { db } from "../../firebase";
import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  getDocs,
  query,
  where,
  onSnapshot,
  orderBy
} from "firebase/firestore";
import { useTheme } from "../../context/ThemeContext";
import { uploadImage } from "../../utils/cloudinary";
import "../../styles/profile.css";

export default function Profile() {
  const { currentUser } = useAuth();
  const { isDarkMode } = useTheme();
  const [profile, setProfile] = useState({
    businessName: "",
    email: "",
    phone: "",
    address: "",
    bio: "",
    website: "",
    slug: "",
    profilePicture: "",
    socialMedia: {
      facebook: "",
      instagram: "",
      twitter: ""
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [hasExistingSlug, setHasExistingSlug] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  
  // Store Statistics State
  const [storeStats, setStoreStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0
  });
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchProfile();
      fetchStoreStats();
      setupRealTimeStats();
    }
  }, [currentUser]);

  const fetchProfile = async () => {
    try {
      const docRef = doc(db, "wholesalers", currentUser.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const existingSlug = !!data.slug;
        setHasExistingSlug(existingSlug);
        
        setProfile({
          businessName: data.businessName || "",
          email: data.email || currentUser.email || "",
          phone: data.phone || "",
          address: data.address || "",
          bio: data.bio || "",
          website: data.website || "",
          slug: data.slug || "",
          profilePicture: data.profilePicture || "",
          socialMedia: data.socialMedia || {
            facebook: "",
            instagram: "",
            twitter: ""
          }
        });

        if (data.profilePicture) {
          setImagePreview(data.profilePicture);
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setMessage({ type: "error", text: "Failed to load profile" });
    } finally {
      setLoading(false);
    }
  };

  const fetchStoreStats = async () => {
    if (!currentUser) return;

    setStatsLoading(true);
    try {
      // Run all queries in parallel
      const [productsSnapshot, ordersSnapshot] = await Promise.all([
        getDocs(query(
          collection(db, "wholesalers", currentUser.uid, "products"),
          orderBy("createdAt", "desc")
        )),
        getDocs(query(collection(db, "wholesalers", currentUser.uid, "orders")))
      ]);

      // Calculate total products and stock exactly like in Dashboard.jsx
      const fetchedProducts = productsSnapshot.docs.map((doc) => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
      const totalProducts = fetchedProducts.length;

      // Calculate total stock like in Dashboard.jsx
      let totalStockCount = 0;
      fetchedProducts.forEach((product) => {
        if (product.variants?.length) {
          product.variants.forEach((v) => (totalStockCount += Number(v.stock) || 0));
        } else {
          totalStockCount += Number(product.stock) || 0;
        }
      });

      const totalOrders = ordersSnapshot.size;
      
      // Calculate total revenue and unique customers from orders
      let totalRevenue = 0;
      const uniqueCustomers = new Set();
      
      ordersSnapshot.forEach(doc => {
        const orderData = doc.data();
        totalRevenue += orderData.total || 0;
        
        // Use customerId as primary identifier, fallback to email
        const customerIdentifier = orderData.customerId || orderData.customerEmail;
        if (customerIdentifier) {
          uniqueCustomers.add(customerIdentifier);
        }
      });

      const totalCustomers = uniqueCustomers.size;

      setStoreStats({
        totalProducts,
        totalStock: totalStockCount,
        totalOrders,
        totalCustomers,
        totalRevenue
      });
    } catch (error) {
      console.error("Error fetching store stats:", error);
      setMessage({ type: "error", text: "Failed to load store statistics" });
    } finally {
      setStatsLoading(false);
    }
  };

  const setupRealTimeStats = () => {
    if (!currentUser) return;

    // Real-time products listener (matches Dashboard.jsx logic exactly)
    const productsUnsub = onSnapshot(
      query(
        collection(db, "wholesalers", currentUser.uid, "products"),
        orderBy("createdAt", "desc")
      ),
      (snapshot) => {
        const fetchedProducts = snapshot.docs.map((doc) => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        
        const totalProducts = fetchedProducts.length;
        
        // Calculate total stock exactly like in Dashboard.jsx
        let totalStockCount = 0;
        fetchedProducts.forEach((product) => {
          if (product.variants?.length) {
            product.variants.forEach((v) => (totalStockCount += Number(v.stock) || 0));
          } else {
            totalStockCount += Number(product.stock) || 0;
          }
        });

        setStoreStats(prev => ({
          ...prev,
          totalProducts,
          totalStock: totalStockCount
        }));
      },
      (error) => {
        console.error("Error in products real-time listener:", error);
      }
    );

    // Real-time orders listener
    const ordersUnsub = onSnapshot(
      collection(db, "wholesalers", currentUser.uid, "orders"),
      (snapshot) => {
        const totalOrders = snapshot.size;
        let totalRevenue = 0;
        const uniqueCustomers = new Set();
        
        snapshot.forEach(doc => {
          const orderData = doc.data();
          totalRevenue += orderData.total || 0;
          
          const customerIdentifier = orderData.customerId || orderData.customerEmail;
          if (customerIdentifier) {
            uniqueCustomers.add(customerIdentifier);
          }
        });

        setStoreStats(prev => ({
          ...prev,
          totalOrders,
          totalCustomers: uniqueCustomers.size,
          totalRevenue
        }));
      },
      (error) => {
        console.error("Error in orders real-time listener:", error);
      }
    );

    return () => {
      productsUnsub();
      ordersUnsub();
    };
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: "error", text: "Please select a valid image file" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "Image size should be less than 5MB" });
      return;
    }

    setUploadingImage(true);
    try {
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);

      const imageUrl = await uploadImage(file);
      
      setProfile(prev => ({
        ...prev,
        profilePicture: imageUrl
      }));

      setMessage({ type: "success", text: "Profile picture uploaded successfully! ✅" });
    } catch (error) {
      console.error("Error uploading image:", error);
      setMessage({ type: "error", text: "Failed to upload profile picture ❌" });
      setImagePreview("");
    } finally {
      setUploadingImage(false);
    }
  };

  const removeProfilePicture = () => {
    setProfile(prev => ({
      ...prev,
      profilePicture: ""
    }));
    setImagePreview("");
    setMessage({ type: "success", text: "Profile picture removed" });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSocialMediaChange = (platform, value) => {
    setProfile(prev => ({
      ...prev,
      socialMedia: {
        ...prev.socialMedia,
        [platform]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    setSaving(true);
    try {
      const docRef = doc(db, "wholesalers", currentUser.uid);
      await updateDoc(docRef, {
        ...profile,
        updatedAt: new Date()
      });
      setMessage({ type: "success", text: "Profile updated successfully! ✅" });
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({ type: "error", text: "Failed to update profile ❌" });
    } finally {
      setSaving(false);
    }
  };

  // Format currency function
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  // Calculate additional metrics
  const averageOrderValue = storeStats.totalOrders > 0 
    ? storeStats.totalRevenue / storeStats.totalOrders 
    : 0;

  const productsPerOrder = storeStats.totalOrders > 0 
    ? (storeStats.totalProducts / storeStats.totalOrders).toFixed(1)
    : "0.0";

  const ordersPerCustomer = storeStats.totalCustomers > 0 
    ? (storeStats.totalOrders / storeStats.totalCustomers).toFixed(1)
    : "0.0";

  if (loading) {
    return (
      <div className={`profile-loading ${isDarkMode ? "dark-mode" : ""}`}>
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className={`profile-page ${isDarkMode ? "dark-mode" : ""}`}>
      {/* Header Section */}
      <div className="profile-header">
        <div className="header-content">
          <h1>Business Profile</h1>
          <p>Manage your business information and store settings</p>
        </div>
        <div className="header-actions">
          {profile.slug && (
            <a 
              href={`/store/${profile.slug}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="preview-btn"
            >
              👁️ Preview Storefront
            </a>
          )}
          <button 
            onClick={fetchStoreStats}
            disabled={statsLoading}
            className={`refresh-stats-btn ${statsLoading ? "loading" : ""}`}
          >
            {statsLoading ? "🔄 Updating..." : "🔄 Refresh Stats"}
          </button>
        </div>
      </div>

      {/* Alert Message */}
      {message.text && (
        <div className={`alert-message ${message.type} ${isDarkMode ? "dark-mode" : ""}`}>
          {message.text}
        </div>
      )}

      <div className="profile-content">
        {/* Business Information Card */}
        <div className="profile-card">
          <div className="card-header">
            <h3>Business Information</h3>
            <p>Update your basic business details</p>
          </div>
          
          {/* Profile Picture Section */}
          <div className="profile-picture-section">
            <h4>Profile Picture</h4>
            <div className="picture-upload-container">
              <div className="picture-preview">
                {imagePreview ? (
                  <img src={imagePreview} alt="Profile Preview" className="profile-preview-img" />
                ) : (
                  <div className="profile-placeholder">
                    <span>📷</span>
                  </div>
                )}
              </div>
              <div className="upload-controls">
                <div className="file-input-wrapper">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="file-input"
                    id="profile-picture"
                  />
                  <label 
                    htmlFor="profile-picture" 
                    className={`upload-btn ${uploadingImage ? "uploading" : ""}`}
                  >
                    {uploadingImage ? "📤 Uploading..." : "📁 Upload Photo"}
                  </label>
                </div>
                {imagePreview && (
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={removeProfilePicture}
                  >
                    🗑️ Remove
                  </button>
                )}
                <small>Recommended: Square image, 500x500px, max 5MB</small>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Business Name *</label>
                <input
                  type="text"
                  name="businessName"
                  value={profile.businessName}
                  onChange={handleChange}
                  required
                  className={isDarkMode ? "dark-mode" : ""}
                  placeholder="Enter your business name"
                />
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleChange}
                  required
                  className={isDarkMode ? "dark-mode" : ""}
                  placeholder="business@example.com"
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={profile.phone}
                  onChange={handleChange}
                  className={isDarkMode ? "dark-mode" : ""}
                  placeholder="+234 800 000 0000"
                />
              </div>

              <div className="form-group">
                <label>Store Slug {hasExistingSlug ? "" : "*"}</label>
                <input
                  type="text"
                  name="slug"
                  value={profile.slug}
                  onChange={handleChange}
                  required={!hasExistingSlug}
                  disabled={hasExistingSlug}
                  className={`${isDarkMode ? "dark-mode" : ""} ${hasExistingSlug ? "disabled-field" : ""}`}
                  placeholder="your-store-name"
                />
                <small>
                  {hasExistingSlug ? (
                    "Store URL cannot be changed once set. Contact support if you need to change it."
                  ) : (
                    `This will be your store URL: /store/${profile.slug || "your-store-name"}`
                  )}
                </small>
              </div>

              <div className="form-group full-width">
                <label>Business Address</label>
                <textarea
                  name="address"
                  value={profile.address}
                  onChange={handleChange}
                  className={isDarkMode ? "dark-mode" : ""}
                  placeholder="Enter your business address"
                  rows="3"
                />
              </div>

              <div className="form-group full-width">
                <label>Business Bio</label>
                <textarea
                  name="bio"
                  value={profile.bio}
                  onChange={handleChange}
                  className={isDarkMode ? "dark-mode" : ""}
                  placeholder="Tell customers about your business..."
                  rows="4"
                />
              </div>
            </div>

            {/* Social Media Section */}
            <div className="social-section">
              <h4>Social Media Links</h4>
              <div className="social-grid">
                <div className="form-group">
                  <label>Facebook</label>
                  <input
                    type="url"
                    value={profile.socialMedia.facebook}
                    onChange={(e) => handleSocialMediaChange("facebook", e.target.value)}
                    className={isDarkMode ? "dark-mode" : ""}
                    placeholder="https://facebook.com/yourpage"
                  />
                </div>

                <div className="form-group">
                  <label>Instagram</label>
                  <input
                    type="url"
                    value={profile.socialMedia.instagram}
                    onChange={(e) => handleSocialMediaChange("instagram", e.target.value)}
                    className={isDarkMode ? "dark-mode" : ""}
                    placeholder="https://instagram.com/yourhandle"
                  />
                </div>

                <div className="form-group">
                  <label>Twitter</label>
                  <input
                    type="url"
                    value={profile.socialMedia.twitter}
                    onChange={(e) => handleSocialMediaChange("twitter", e.target.value)}
                    className={isDarkMode ? "dark-mode" : ""}
                    placeholder="https://twitter.com/yourhandle"
                  />
                </div>
              </div>
            </div>

            {/* Website */}
            <div className="form-group">
              <label>Website</label>
              <input
                type="url"
                name="website"
                value={profile.website}
                onChange={handleChange}
                className={isDarkMode ? "dark-mode" : ""}
                placeholder="https://yourwebsite.com"
              />
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className={`save-btn ${saving ? "saving" : ""} ${isDarkMode ? "dark-mode" : ""}`}
                disabled={saving || uploadingImage}
              >
                {saving ? "💾 Saving..." : "💾 Save Changes"}
              </button>
            </div>
          </form>
        </div>

        {/* Enhanced Store Statistics Card */}
        <div className="stats-card">
          <div className="card-header">
            <h3>Store Statistics</h3>
            <p>Real-time business overview</p>
          </div>
          
          {statsLoading ? (
            <div className="stats-loading">
              <div className="loading-spinner-small"></div>
              <span>Updating statistics...</span>
            </div>
          ) : (
            <>
              <div className="stats-grid">
                
                
                <div className="stat-item">
                  <div className="stat-icon orders">🛒</div>
                  <div className="stat-content">
                    <span className="stat-number">{storeStats.totalOrders}</span>
                    <span className="stat-label">Total Orders</span>
                    <span className="stat-trend">Live</span>
                  </div>
                </div>
                
                <div className="stat-item">
                  <div className="stat-icon customers">👥</div>
                  <div className="stat-content">
                    <span className="stat-number">{storeStats.totalCustomers}</span>
                    <span className="stat-label">Total Customers</span>
                    <span className="stat-trend">From Orders</span>
                  </div>
                </div>
              </div>
              
              {/* Additional Stats Summary */}
              <div className="stats-summary">
                <div className="summary-item">
                  <span>Total Revenue:</span>
                  <strong>{formatCurrency(storeStats.totalRevenue)}</strong>
                </div>
                <div className="summary-item">
                  <span>Average Order Value:</span>
                  <strong>{formatCurrency(averageOrderValue)}</strong>
                </div>
                <div className="summary-item">
                  <span>Products per Order:</span>
                  <strong>{productsPerOrder}</strong>
                </div>
                <div className="summary-item">
                  <span>Orders per Customer:</span>
                  <strong>{ordersPerCustomer}</strong>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}